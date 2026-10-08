import { chromium, request as apiRequest, expect } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

// Actual BFF -> isolated Django/Postgres/Redis/MinIO. No API routing mocks.
const base = 'http://127.0.0.1:3108';
const output = 'artifacts/integration-final-fixes';
const password = 'Local-QA-Only-2026!';
const fixtures = JSON.parse(fs.readFileSync(`${output}/fixtures.log`, 'utf8').split('QA_FIXTURES=')[1].trim());
const calls = [];
const workflows = [];
const contexts = [];
const browser = await chromium.launch();
let failure;
async function context() {
  const context = await apiRequest.newContext({ baseURL: base });
  contexts.push(context);
  return context;
}
async function call(client, method, path, data, statuses = [200], multipart) {
  const response = await client.fetch(`/api${path}`, { method, data, multipart, timeout: 90000 });
  const json = await response.json().catch(() => null);
  calls.push({ method, path, status: response.status() });
  assert(statuses.includes(response.status()), `${method} ${path}: ${response.status()} ${JSON.stringify(json?.message || json?.detail || '')}`);
  return json;
}
async function login(email) {
  const client = await context();
  await call(client, 'POST', '/auth/login/', { email, password });
  await call(client, 'GET', '/auth/me/');
  return client;
}
async function confirmPayment(patient, admin, id) {
  await call(patient, 'POST', `/payments/${id}/submit-transfer/`, undefined, [200], {
    proof: { name: 'qa-proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nLocal QA fixture - no real transfer\n%%EOF') },
  });
  await call(admin, 'POST', `/admin/payments/${id}/confirm/`, { provider_reference: `LOCAL-QA-NO-CASH-${id}`, note: 'Disposable QA database; no real transfer.' });
  const payment = await call(patient, 'GET', `/payments/${id}/`);
  assert.equal(payment.status, 'success');
  assert.equal(payment.provider, 'bank_transfer');
}
try {
  const patient = await context();
  const email = `qa-patient-${Date.now()}@caretekk.invalid`;
  await call(patient, 'POST', '/auth/email/verify/request/', { email });
  const mailFiles = fs.readdirSync(`${output}/mailbox`).sort((a, b) => fs.statSync(`${output}/mailbox/${b}`).mtimeMs - fs.statSync(`${output}/mailbox/${a}`).mtimeMs);
  const mail = mailFiles.map(f => fs.readFileSync(`${output}/mailbox/${f}`, 'utf8')).find(text => text.includes(email));
  assert(mail, 'Verification message must be delivered to the isolated file mailbox');
  const code = mail.match(/\b\d{6}\b/)?.[0];
  assert(code, 'Verification message must contain its real generated test OTP');
  await call(patient, 'POST', '/auth/email/verify/confirm/', { email, code });
  await call(patient, 'POST', '/auth/register/', { email, password, phone: '+2348012345678', role: 'patient' }, [201]);
  await call(patient, 'POST', '/auth/login/', { email, password });
  const user = await call(patient, 'GET', '/auth/me/');
  await call(patient, 'PATCH', '/auth/me/', { full_name: 'Local QA Patient' });
  const profile = await call(patient, 'PATCH', '/profiles/me/', { age_range: '25-34', gender: 'female', state: 'Akwa Ibom', lga: 'Eket', address: 'Local QA fictional address' });
  assert.equal(profile.profile_complete, true);
  workflows.push('Real OTP delivery to local mailbox, email verification, registration, login and patient onboarding');
  const admin = await login('qa-admin@caretekk.invalid');
  const doctor = await login('qa-clinician@caretekk.invalid');
  const nurse = await login('qa-nurse@caretekk.invalid');
  await call(doctor, 'GET', '/profiles/me/');
  await call(nurse, 'GET', '/profiles/me/');
  const doctors = await call(patient, 'GET', '/appointments/available-doctors/');
  assert(doctors.results.some(row => row.id === fixtures.doctor_profile));
  workflows.push('Doctor/nurse profiles and normal patient doctor discovery');
  for (const path of ['/triage/start', '/triage/conversation/start', '/appointments/book/', '/home-care/requests/book/']) {
    await call(patient, 'POST', path, { consultation_country: 'US' }, [403]);
    await call(patient, 'POST', path, {}, [403]);
  }
  workflows.push('Missing and overseas declarations refused at all four clinical entry points');
  const triage = await call(patient, 'POST', '/triage/start', { consultation_country: 'NG' }, [201]);
  const conversation = await call(patient, 'POST', '/triage/conversation/start', { session_id: triage.id, consultation_country: 'NG' }, [200, 201, 202]);
  const conversationId = conversation.conversation.id;
  await call(patient, 'POST', `/triage/conversation/${conversationId}/message`, { message: 'I have a mild headache', severity: 'mild', age: 30, gender: 'female', location: 'Eket, Nigeria' }, [200, 201, 202]);
  await call(patient, 'POST', `/triage/conversation/${conversationId}/complete`, {}, [200, 202]);
  let report;
  for (let attempt = 0; attempt < 30; attempt++) {
    report = await call(patient, 'GET', `/triage/conversation/${conversationId}/result`, undefined, [200, 202]);
    if (report.status !== 'processing') break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.equal(report.status, 'completed');
  const doctorAppointments = await call(doctor, 'GET', '/appointments/');
  const schedule = new Date(fixtures.scheduled_at);
  while (doctorAppointments.results.some(row => Math.abs(new Date(row.scheduled_at) - schedule) < 3600000)) schedule.setUTCDate(schedule.getUTCDate() + 1);
  const booking = await call(patient, 'POST', '/appointments/book/', {
    doctor: fixtures.doctor_profile, triage_session: triage.id, scheduled_at: schedule.toISOString(),
    reason: 'Local QA fictional headache', consultation_country: 'NG', callback_url: `${base}/payments`,
  }, [201]);
  assert.equal(booking.payment.provider, 'bank_transfer');
  assert.equal(booking.payment.amount, '2000.00');
  await confirmPayment(patient, admin, booking.payment.payment_id);
  const appointments = await call(patient, 'GET', '/appointments/');
  const appointment = appointments.results.find(row => row.id === booking.appointment.id);
  assert(['confirmed', 'scheduled'].includes(appointment.status));
  workflows.push('Real completed triage, Nigeria booking, bank-transfer initialization, MinIO proof upload, admin test confirmation and fixed payment polling');
  const referral = await call(doctor, 'POST', '/referrals/', { patient: profile.id, appointment: appointment.id, referred_to: 'Local QA fictional clinic', notes: 'Local QA only' }, [201]);
  await call(patient, 'PATCH', `/referrals/${referral.id}/`, { status: 'contacted' }, [403]);
  const updated = await call(admin, 'PATCH', `/referrals/${referral.id}/`, { status: 'contacted' });
  assert.equal(updated.status, 'contacted');
  workflows.push('Clinical referral creation and fixed PATCH proxy, with real admin-only status authorization');
  const threads = await call(patient, 'GET', '/messages/threads/');
  const thread = threads.results.find(row => row.appointment?.id === appointment.id);
  assert(thread, 'Verified booking must create its real messaging thread');
  await call(doctor, 'POST', `/messages/threads/${thread.id}/messages/`, { body: 'Local QA doctor message' }, [201]);
  const messages = await call(patient, 'GET', `/messages/threads/${thread.id}/messages/`);
  assert(messages.results.some(row => row.body === 'Local QA doctor message'));
  const wsPage = await browser.newPage();
  await wsPage.context().addCookies((await patient.storageState()).cookies);
  await wsPage.goto(`${base}/messages`);
  const wsResult = await wsPage.evaluate(async id => new Promise(resolve => {
    const socket = new WebSocket(`ws://127.0.0.1:8108/ws/threads/${id}/`);
    const timer = setTimeout(() => { socket.close(); resolve('timeout'); }, 15000);
    socket.onopen = () => { clearTimeout(timer); socket.close(); resolve('connected'); };
    socket.onerror = () => { clearTimeout(timer); resolve('error'); };
  }), thread.id);
  assert.equal(wsResult, 'connected');
  await wsPage.close();
  workflows.push('Real doctor/patient REST messaging and cookie-authenticated local Channels/Redis WebSocket handshake');
  const homecare = await call(patient, 'POST', '/home-care/requests/book/', {
    booking_source: 'direct', service: fixtures.homecare_service, service_zone: 'eket',
    consultation_country: 'NG', contact_name_snapshot: 'Local QA Patient', contact_phone_snapshot: '+2348012345678',
    service_address_snapshot: 'Local QA fictional address, Eket, Akwa Ibom', care_notes: 'Local QA only', callback_url: `${base}/payments`,
  }, [201]);
  await confirmPayment(patient, admin, homecare.payment.payment_id);
  await call(patient, 'GET', '/home-care/requests/');
  const assignments = await call(nurse, 'GET', '/home-care/assignments/');
  assert(assignments.results.length > 0);
  workflows.push('Real Eket homecare checkout, proof/storage, status confirmation, request listing and nurse assignment');
  for (const [role, client] of [['patient', patient], ['doctor', doctor], ['nurse', nurse]]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 1100 } });
    await page.context().addCookies((await client.storageState()).cookies);
    await page.goto(`${base}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0);
    await page.screenshot({ path: `${output}/real-${role}-dashboard.png`, fullPage: true });
    await page.close();
  }
  workflows.push('Actual backend-authenticated patient, doctor and nurse dashboard browser smoke checks');
  await call(patient, 'POST', '/auth/logout/', {});
  await call(patient, 'GET', '/auth/me/', undefined, [401]);
  workflows.push('Actual logout and revoked session access');
} catch (error) {
  failure = error.message;
  console.error(failure);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(`${output}/real-backend-integration.json`, JSON.stringify({
    scope: 'Actual frontend BFF and isolated Django/Postgres/Redis/MinIO, no API mocks; no real cash or live payment credentials',
    workflows, calls, failure, excluded: ['External Paystack initialization/webhook', 'Provider credential verification', 'Policy/clinical-consent UI not located in supplied repository'],
  }, null, 2));
  for (const context of contexts) await context.dispose();
  await browser.close();
}
