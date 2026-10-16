// Synthetic, loopback-only regressions for PR4 findings. No external payment calls.
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3106';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw Error('Loopback QA only');
const output = process.env.QA_OUTPUT_DIR || 'artifacts/founder50-remediation';
fs.mkdirSync(output,{recursive:true});
const fixture = process.env.QA_LOCAL_BACKEND_FIXTURE ? JSON.parse(fs.readFileSync(process.env.QA_LOCAL_BACKEND_FIXTURE,'utf8')) : null;
const browser = await chromium.launch();
const results=[];
async function probe(mode,width=390,zone='Africa/Lagos') {
 const context=await browser.newContext({viewport:{width,height:950},timezoneId:zone});
 await context.addCookies([{name:'caretekk_session',value:'1',url:base},...(fixture?[{name:'caretekk_access',value:fixture.access,url:base,httpOnly:true}]:[])]);
 const page=await context.newPage();
 await page.clock.install({time:new Date('2026-10-15T11:34:56Z')});
 await page.clock.setFixedTime(new Date(mode.startsWith('paid-future-')?'2026-10-15T16:34:56Z':mode==='skew'?'2026-10-14T11:34:56Z':'2026-10-15T11:34:56Z'));
 await page.addLocatorHandler(page.getByRole('button',{name:'Not now',exact:true}),async locator=>locator.click());
 const empty={count:0,next:null,previous:null,results:[]};
 let claim=null,posts=[],commits=0,reserves=0,promotionRequests=0,committedAppointmentId=null;
 const doctorId=fixture?.doctor||42;
 const pricing={service_value:'2000.00',discount:'2000.00',amount_due:'0.00',currency:'NGN',promotion_applied:true,reward_applied:false,promotion_code:'FOUNDER50'};
 const doctors=[doctorId,43].map(id=>({id,display_name:id===doctorId?'Dr Ada':'Dr Ben',specialties:[],availability_status:mode==='unavailable'?'unavailable':'available',preferred_availability_status:'available',rating:4.8,review_count:3,active_workload:0,unavailable_consultation_slots:[]}));
 await context.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.includes('/promotions/'))promotionRequests++;
  if(fixture&&(path.includes('/promotions/')||path.endsWith('/appointments/book/'))){
   if(path.endsWith('/appointments/book/')){
    posts.push(route.request().postDataJSON());
    if(posts.length===1&&mode==='lostBefore')return route.abort('failed');
    if(posts.length===1&&mode==='lostAfter'){
     const response=await route.fetch();expect(response.status()).toBe(201);committedAppointmentId=(await response.json()).appointment.id;return route.abort('failed');
    }
   }
   return route.continue();
  }
  let body=empty,status=200;
  if(path.includes('/auth/me'))body={id:fixture?.user||901,role:'patient',email:'qa@example.test',full_name:'Review Patient',is_email_verified:true};
  else if(path.includes('/profiles/me'))body={id:fixture?.user||901,profile_complete:true};
  else if(path.includes('/available-doctors'))body={...empty,count:2,results:doctors};
  else if(path.endsWith('/promotions/founder50/')){
   if(mode.startsWith('outage')){if(mode.includes('timeout'))return route.abort('timedout');status=Number(mode.split('-')[1]);body={detail:'Promotion status unavailable'};}
   else {if(mode==='expired'&&claim)claim={...claim,status:'expired'};body={accepting_reservations:true,eligible:!claim,can_reserve:!claim,remaining_capacity:50,claim,code:'available'};}
  }else if(path.endsWith('/reserve/')){
   reserves++;
   if(mode==='campaignDisabled'){status=409;body={code:'campaign_unavailable'};}
   else if(mode==='applyTimeout')return route.abort('timedout');
   else {claim={public_id:'00000000-0000-4000-8000-000000000001',status:'reserved',reserved_at:'2026-10-15T11:34:56Z',expires_at:'2026-10-16T11:34:56Z'};body={reservation:claim,pricing};status=201;}
  }else if(path.endsWith('/release/')){claim={...claim,status:'released'};body={reservation:claim,pricing:null};}
  else if(path.includes('/promotions/reservations/'))body={reservation:claim,pricing:claim?.status==='reserved'?pricing:null};
  else if(path.endsWith('/appointments/book/')){
   const data=route.request().postDataJSON();posts.push(data);
   if(!data.promotion_reservation_id){
    body=mode.includes('bank')?{appointment:{id:456,status:'pending_payment'},payment:{payment_id:789,provider:'bank_transfer',status:'awaiting_transfer',amount:'2000.00',currency:'NGN',bank_transfer:{bank_name:'QA Bank',account_name:'Caretekk QA',account_number:'0000000000',reference:'QA-TRANSFER'}}}:{appointment:{id:456,status:'pending_payment'},payment:{payment_id:789,provider:'paystack',status:'pending',amount:'2000.00',authorization_url:base+'/qa-paystack',currency:'NGN'}};
   }else if(mode==='skew'&&posts.length===1){status=400;body={code:'invalid_booking',detail:'Select a future consultation time.'};}
   else if(mode.startsWith('lost')&&posts.length===1){if(mode==='lostAfter') {commits++;claim={...claim,status:'booked'};}return route.abort('failed');}
   else {
    if(mode==='double')await new Promise(r=>setTimeout(r,400));
    if(!commits)commits++;
    if(posts.length>1&&mode.startsWith('lost'))expect(data).toEqual(posts[0]);
    claim={...claim,status:'booked'};
    body={appointment:{id:456,status:'confirmed',doctor:data.doctor,doctor_profile:{id:data.doctor,display_name:'Dr Ada'},scheduled_at:data.scheduled_at},payment:{payment_id:789,provider:'promotional',status:'success',amount:'0.00',currency:'NGN'},checkout_type:'promotional',checkout_action:'confirmed',payment_required:false,booking_status:'confirmed',amount_due:'0.00',reservation:claim};status=201;
   }
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto(`${base}/appointments?triage_session=${fixture?.triage||5}`);
 await page.getByRole('button',{name:'View recommended doctors',exact:true}).click();
 const select=page.getByRole('article').filter({hasText:'Dr Ada'}).getByRole('button',{name:'Select Doctor',exact:true});
 if(mode==='unavailable') {await expect(select).toBeDisabled();results.push({mode,blocked:true});await context.close();return;}
 await select.click();
 let dialog=page.getByRole('dialog',{name:'Confirm doctor and time'});
 await dialog.getByRole('button',{name:/Consult now/}).click();
 const panel=()=>dialog.getByRole('region',{name:'Promotional consultation'});
 if(mode.startsWith('outage')||mode.startsWith('paid-')||mode==='typedOnly'){
  if(mode.startsWith('paid-future-')){await dialog.getByRole('button',{name:/Schedule for later/}).click();await dialog.getByRole('button',{name:'Date',exact:true}).click();await dialog.locator('input[type=date]').fill('2026-10-20');await dialog.getByRole('button',{name:'8:00 AM',exact:true}).click();}
  if(mode==='typedOnly'){await expect(panel().getByLabel('Promo code')).toBeEnabled();await panel().getByLabel('Promo code').fill('FOUNDER50');}
  const pay=dialog.getByRole('button',{name:'Make Payment',exact:true}).first();await expect(pay).toBeEnabled();
  await pay.click();await expect.poll(()=>posts.length).toBe(1);expect(posts[0].promotion_reservation_id).toBeUndefined();expect(reserves).toBe(0);
  expect(posts[0].scheduled_at).toBe(mode.startsWith('paid-future-')?'2026-10-20T07:00:00.000Z':'2026-10-15T11:34:56.000Z');
  expect(posts[0].doctor).toBe(doctorId);
  if(process.env.QA_PAID_DISABLED==='true')expect(promotionRequests).toBe(0);
  if(!mode.includes('bank'))await expect(page).toHaveURL(base+'/qa-paystack');
  else {await expect(page.getByText('Bank transfer payment',{exact:true})).toBeVisible();await expect(page.getByText('QA Bank',{exact:true})).toBeVisible();}
  results.push({mode,zone,scheduled_at:posts[0].scheduled_at,paidPosts:posts.length,reserves});
 }else{
  await expect(panel().getByLabel('Promo code')).toBeEnabled({timeout:15000});await panel().getByLabel('Promo code').fill('FOUNDER50');await panel().getByRole('button',{name:'Apply',exact:true}).click();
  if(mode==='released'||mode==='expired'){
   if(mode==='released'){await expect(panel().getByText('Total to pay')).toBeVisible();await panel().getByRole('button',{name:'Remove promotion',exact:true}).click();}
   else {await expect(panel().getByText('Your reservation expired. Apply again to check availability.')).toBeVisible();await expect(dialog.getByRole('button',{name:'Make Payment',exact:true}).first()).toBeDisabled();await panel().getByRole('button',{name:'Choose ordinary paid checkout'}).click();}
   await expect(dialog.getByRole('button',{name:/Consult now/})).toBeEnabled();
   await dialog.getByRole('button',{name:'Make Payment',exact:true}).first().click();await expect.poll(()=>posts.length).toBe(1);expect(posts[0].promotion_reservation_id).toBeUndefined();expect(posts[0].scheduled_at).toBe('2026-10-15T11:34:56.000Z');results.push({mode,explicitPaidTransition:true});
  }else if(mode==='campaignDisabled'||mode==='applyTimeout'){
   await expect(panel().getByRole('alert')).toBeVisible();await expect(dialog.getByRole('button',{name:'Make Payment',exact:true}).first()).toBeDisabled();expect(posts).toHaveLength(0);
   if(mode==='campaignDisabled'){await panel().getByRole('button',{name:'Choose ordinary paid checkout'}).click();await expect(dialog.getByRole('button',{name:'Make Payment',exact:true}).first()).toBeEnabled();}
   results.push({mode,noPaidFallback:true});
  }else{
   await expect(panel().getByText('Total to pay')).toBeVisible();
   await expect(dialog.getByText('Your selected doctor and Consult now choice have not changed.',{exact:false})).toBeVisible();
   await expect(dialog.getByRole('button',{name:'Book Free Consultation',exact:true}).first()).toBeDisabled();expect(posts).toHaveLength(0);
   await dialog.getByRole('button',{name:/Earliest appointment/}).click();
   const response=fixture?page.waitForResponse(r=>/\/appointments\/book\/?$/.test(new URL(r.url()).pathname)&&![307,308].includes(r.status())):null;
   const confirm=dialog.getByRole('button',{name:'Book Free Consultation',exact:true}).first();
   if(mode==='double')await confirm.evaluate(el=>{el.click();el.click();});else await confirm.click();
   if(mode.startsWith('lost')){
    await expect(dialog.getByRole('button',{name:'Recover booking result'})).toBeVisible();
    await expect(dialog.getByRole('button',{name:'Change doctor',exact:true})).toBeDisabled();
    await expect(dialog.getByRole('button',{name:/Schedule for later/})).toBeDisabled();
    await expect(dialog.getByRole('button',{name:'Tomorrow',exact:true})).toBeDisabled();
    await expect(dialog.getByRole('button',{name:/^(Book Free Consultation|Make Payment)$/}).first()).toBeDisabled();await expect(panel().getByText(/Original doctor: Dr Ada/)).toBeVisible();
    if(mode==='lostTabs') {
      const other=await context.newPage();await other.goto(`${base}/appointments?triage_session=5`);
      await expect(other.getByRole('button',{name:'Recover booking result'}).last()).toBeVisible();
      await Promise.all([page.getByRole('button',{name:'Recover booking result'}).last().evaluate(el=>el.click()),other.getByRole('button',{name:'Recover booking result'}).last().evaluate(el=>el.click())]);
    } else {
      if(mode==='lostHistory') {await page.goto(`${base}/appointments?triage_session=5&history=1`);await page.goBack();}
      else await page.reload();
      await page.getByRole('button',{name:'Recover booking result'}).last().click();
    }
   }else if(mode==='skew'){
    await expect(panel().getByRole('alert')).toBeVisible();await expect(page.getByText('Your free consultation is confirmed.',{exact:true})).toHaveCount(0);
    await dialog.getByRole('button',{name:'Date',exact:true}).click();await dialog.locator('input[type=date]').fill('2026-10-17');await dialog.getByRole('button',{name:'8:00 AM',exact:true}).click();await confirm.click();
    expect(posts[1].idempotency_key).not.toBe(posts[0].idempotency_key);
   }
   let realResult;
   if(response){const res=await response;expect([200,201]).toContain(res.status());realResult=await res.json();expect(realResult.payment.amount).toBe('0.00');expect(realResult.appointment.status).toBe('confirmed');if(committedAppointmentId)expect(realResult.appointment.id).toBe(committedAppointmentId);}
   await expect(page.getByText('Your free consultation is confirmed.',{exact:true})).toBeVisible();
   if(mode.startsWith('lost'))expect(posts[1]).toEqual(posts[0]);
   if(!fixture){expect(commits).toBe(1);if(mode==='double')expect(posts).toHaveLength(1);}
   results.push({mode,commits:fixture?1:commits,posts:posts.length,original:posts[0],realBooking:realResult?{id:realResult.appointment.id,scheduled_at:realResult.appointment.scheduled_at,amount:realResult.payment.amount}:undefined});
  }
 }
 await page.screenshot({path:`${output}/${mode}.png`,fullPage:true});await context.close();
}
try{
 if(process.env.QA_TIMEZONE_MATRIX==='true') {
  for(const zone of ['Africa/Lagos','UTC','America/New_York','Europe/London'])for(const provider of ['paystack','bank'])await probe(`paid-future-${provider}`,390,zone);
  fs.writeFileSync(`${output}/timezone-results.json`,JSON.stringify(results,null,2));console.log('PASS timezone matrix',results.length);
 } else for(const mode of fixture?[process.env.QA_REAL_PAID==='true'?'paid-paystack':process.env.QA_REAL_RECOVERY||'realEarliest']:(process.env.QA_CASES?.split(',')||(process.env.QA_PAID_DISABLED==='true'?['paid-paystack','paid-bank']:['paid-paystack','paid-bank','typedOnly','released','expired','earliest','unavailable','outage-503-paystack','outage-500-bank','outage-403-paystack','outage-timeout-paystack','campaignDisabled','applyTimeout','lostBefore','lostAfter','lostHistory','lostTabs','double','skew']))){
  await probe(mode,mode==='lostBefore'?1440:390);fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));console.log('PASS',mode);
 }
}finally{await browser.close();}
