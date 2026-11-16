// Synthetic UI contracts only. Backend authorization and funding invariants run in PostgreSQL CI.
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const base=process.env.QA_BASE_URL;
if(!base || new URL(base).hostname!=='127.0.0.1' || process.env.QA_LOCAL_BACKEND_FIXTURE)throw Error('Isolated synthetic loopback only');
const out=process.env.QA_OUTPUT_DIR;fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const results=[];
try {
 for(const mode of ['doctor-administrative','doctor-start','patient-ready','patient-renew-readiness','patient-early-agreement','elapsed-window']) {
  const role=mode.startsWith('doctor')?'doctor':'patient';
  const early=['doctor-administrative','patient-early-agreement'].includes(mode);
  const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',timezoneId:'Africa/Lagos'});
  await context.addCookies([{name:'caretekk_session',value:'1',url:base}]);
  let t={id:901,patient:901,doctor:902,patient_profile:{id:901,display_name:'Synthetic Patient'},doctor_profile:{id:902,display_name:'Dr Synthetic'},
   appointment:{id:903,status:'confirmed',scheduled_at:new Date(Date.now()+(early?86400000:-60000)).toISOString()},
   consultation_status:mode==='elapsed-window'?'expired':'open',consultation_started_at:null,consultation_expires_at:null,
   session_controls:mode==='elapsed-window'?null:{early_requested:mode==='patient-early-agreement',patient_ready:mode==='doctor-start'},
   can_send_messages:mode!=='elapsed-window',can_end_consultation:false,created_at:new Date().toISOString()};
  const actions=[];const writes=[];const empty={count:0,next:null,previous:null,results:[]};
  await context.route('**/api/**',async route=>{
   const request=route.request(),p=new URL(request.url()).pathname;
   if(p.includes('/promotions/') || p.includes('/payments/') || p.includes('/appointments/book'))throw Error('Lifecycle UI must not change financial or voucher state');
   let json=empty;
   if(p.includes('/auth/me'))json={id:role==='doctor'?902:901,role,full_name:'Synthetic QA',email:'synthetic@example.test',is_email_verified:true};
   else if(p.endsWith('/providers/me/heartbeat/'))json={provider_type:'doctor',availability_status:'available',preferred_availability_status:'available',active_workload_count:0,can_self_update:true,allowed_statuses:['available','offline','on_break']};
   else if(p.includes('/profiles/me'))json={id:901,profile_complete:true};
   else if(p.endsWith('/messages/threads/'))json={...empty,count:1,results:[t]};
   else if(p.includes('/session/')){
    const action=p.split('/').filter(Boolean).at(-1);actions.push(action);
    if(action==='ready')t={...t,session_controls:{...t.session_controls,patient_ready:true}};
    if(action==='start')t={...t,consultation_started_at:new Date().toISOString(),consultation_expires_at:new Date(Date.now()+1200000).toISOString(),session_controls:null};
    json=t;
   } else if(p.endsWith('/messages/') && request.method()==='POST'){
    writes.push('administrative-message');json={id:904,thread:901,sender:902,body:'Synthetic scheduling coordination',created_at:new Date().toISOString()};
   } else if(p.endsWith('/messages/'))json=empty;
   else if(p.endsWith('/realtime-ticket/'))return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'Synthetic polling-only test'})});
   else throw Error('Missing synthetic fixture for '+p);
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(json)});
  });
  const page=await context.newPage();
  await page.goto(base+'/messages');
  await page.getByRole('button',{name:new RegExp(role==='doctor'?'Synthetic Patient':'Dr Synthetic')}).first().click();
  if(mode==='doctor-administrative'){
   await expect(page.getByRole('button',{name:'Start clinical consultation'})).toBeDisabled();
   await page.getByPlaceholder('Type a message').fill('Synthetic scheduling coordination');
   await page.getByRole('button',{name:'Send message'}).click();
   await expect.poll(()=>writes.length).toBe(1);expect(actions).toEqual([]);expect(t.consultation_started_at).toBeNull();
  }else if(mode==='doctor-start'){
   await page.getByRole('button',{name:'Start clinical consultation'}).click();
   await expect.poll(()=>actions).toEqual(['start']);await expect(page.getByRole('button',{name:'Start clinical consultation'})).toHaveCount(0);
  }else if(mode==='patient-early-agreement'){
   page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Agree to requested early start'}).click();expect(actions).toEqual([]);
   page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Agree to requested early start'}).click();await expect.poll(()=>actions).toEqual(['agree-early']);
  }else if(mode==='elapsed-window'){
   await expect(page.getByRole('button',{name:'I am ready for my consultation'})).toHaveCount(0);expect(actions).toEqual([]);
  }else{
   await page.getByRole('button',{name:'I am ready for my consultation'}).click();await expect.poll(()=>actions).toEqual(['ready']);
  }
  results.push({mode,actions,financialRequests:0,pass:true});await page.waitForLoadState('domcontentloaded');await page.screenshot({path:`${out}/${mode}.png`,animations:'disabled',caret:'hide'});await context.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS lifecycle UI contracts',results.length);
}finally{await browser.close();}
