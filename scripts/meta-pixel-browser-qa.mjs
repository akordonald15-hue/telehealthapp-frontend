import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import { evidence, saveIsolation } from './meta-pixel-browser-isolation.mjs';

const output=process.env.QA_OUTPUT_DIR||'artifacts/meta-pixel-browser-20261116';
const phase=process.env.QA_PIXEL_PHASE||'on';
if(!['on','off'].includes(phase)) throw Error('Unknown phase');
const origin='https://www.caretekk.com';
const key='caretekk:advertising-consent:v1';
const ttl=180*86400000;
const browser=await chromium.launch();
const results=[];
let current='';
const user={id:901,role:'patient',email:'synthetic@example.test',full_name:'Synthetic Patient',is_email_verified:true};

async function setup({grant=false,account=false,seed=null,viewport={width:1280,height:900}}={}) {
  const context=await browser.newContext({viewport});
  const id=evidence.contexts.at(-1).id;
  await context.addInitScript(({grant,key,ttl,seed})=>{
    if(!['http:','https:'].includes(location.protocol))return;
    if(grant&&!localStorage.getItem(key)) {const now=Date.now();localStorage.setItem(key,JSON.stringify({v:1,advertising:'granted',decidedAt:now,expiresAt:now+ttl}));}
    if(seed==='recovery')localStorage.setItem('caretekk:founder50:v1:synthetic','synthetic recovery');
    if(seed==='user')sessionStorage.setItem('caretekk:auth-user','synthetic account marker');
    if(seed==='gpc')Object.defineProperty(navigator,'globalPrivacyControl',{value:true});
    if(seed==='storage-blocked')Storage.prototype.setItem=()=>{throw Error('Synthetic storage refusal');};
  },{grant,key,ttl,seed});
  if(account)await context.addCookies([{name:'caretekk_session',value:'1',url:origin}]);
  let authenticated=account;
  await context.route('**/api/**',async route=>{
    const p=new URL(route.request().url()).pathname;
    let status=200,body={count:0,next:null,previous:null,results:[]};
    if(p.endsWith('/auth/login/')){authenticated=true;body={access:'synthetic-not-a-token',user};}
    else if(p.includes('/auth/me')){status=authenticated?200:401;body=authenticated?user:{detail:'Authentication required'};}
    else if(p.replace(/\/$/,'')==='/api/profiles/me')body={id:901,profile_complete:true};
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();
  return {context,page,id};
}
const meta=id=>evidence.network.filter(x=>x.context===id&&x.kind==='meta');
const events=id=>meta(id).filter(x=>x.event);
async function settle(page){
  await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(1500);
  // Respect stacking: consent is above the existing install prompt. Dismiss PWA only once consent UI closes.
  if(!await page.getByRole('dialog',{name:'Advertising preferences'}).isVisible() && await page.getByRole('button',{name:'Not now',exact:true}).isVisible()) await page.getByRole('button',{name:'Not now',exact:true}).click();
}
async function noPixel(page,id){await settle(page);expect(meta(id)).toHaveLength(0);expect(await page.evaluate(()=>typeof window.fbq)).toBe('undefined');}
async function runtimeState(page){
  try{return await page.evaluate(()=>typeof window.fbq);}
  catch(error){if(/Execution context was destroyed|Cannot find context/.test(error.message))return 'navigating';throw error;}
}
async function run(name,fn){current=name;await fn();results.push({name,status:'PASS',at:new Date().toISOString()});fs.writeFileSync(`${output}/${phase}-results.json`,JSON.stringify({phase,results},null,2));console.log('PASS',name);}

try {
  if(phase==='off') {
    await run('default-off despite stored grant',async()=>{const{context,page,id}=await setup({grant:true});await page.goto(origin);await noPixel(page,id);await expect(page.getByRole('dialog',{name:'Advertising preferences'})).toHaveCount(0);await page.screenshot({path:`${output}/default-off.png`});await context.close();});
  } else {
    await run('before consent and rejection: zero SDK/beacons',async()=>{const{context,page,id}=await setup({viewport:{width:390,height:844}});await page.goto(origin);await expect(page.getByRole('dialog',{name:'Advertising preferences'})).toBeVisible();await noPixel(page,id);await page.screenshot({path:`${output}/consent-mobile.png`});await page.getByRole('button',{name:'Reject / withdraw',exact:true}).click();await page.reload();await noPixel(page,id);await context.close();});
    await run('accept: official SDK and exactly one manual homepage PageView',async()=>{const{context,page,id}=await setup();await page.goto(origin);await page.getByRole('button',{name:'Allow advertising',exact:true}).click();await expect.poll(()=>events(id).length,{timeout:15000}).toBe(1);expect(events(id)[0].event).toBe('PageView');expect(events(id)[0].location).toBe(origin+'/');expect(events(id)[0].referrer||'').toBe('');await page.evaluate(()=>{location.hash='services';});await settle(page);expect(events(id)).toHaveLength(1);await page.screenshot({path:`${output}/accepted-homepage.png`});await context.close();});
    await run('withdraw: revoke, clear advertising cookies and reload clean document',async()=>{const{context,page,id}=await setup({grant:true});await page.goto(origin);await expect.poll(()=>events(id).length,{timeout:15000}).toBe(1);const doc=await page.evaluate(()=>window.__qaDocument);await context.addCookies([{name:'qa_essential',value:'keep',url:origin}]);await page.getByRole('button',{name:'Advertising preferences',exact:true}).click();await page.getByRole('button',{name:'Reject / withdraw',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__qaDocument)).not.toBe(doc);await settle(page);expect(events(id)).toHaveLength(1);expect(await page.evaluate(()=>typeof window.fbq)).toBe('undefined');const cookies=await context.cookies();expect(cookies.some(c=>['_fbp','_fbc'].includes(c.name))).toBe(false);expect(cookies.some(c=>c.name==='qa_essential'&&c.value==='keep')).toBe(true);await page.reload();await settle(page);expect(events(id)).toHaveLength(1);await context.close();});
    for(const target of ['/?fbclid=synthetic-click','/?utm_source=synthetic&utm_campaign=public','/?token=synthetic','#unknown-private'])await run(`URL exclusion ${target}`,async()=>{const{context,page,id}=await setup({grant:true});await page.goto(origin+(target.startsWith('#')?'/'+target:target));await noPixel(page,id);await context.close();});
    for(const seed of ['recovery','user','gpc'])await run(`context exclusion ${seed}`,async()=>{const{context,page,id}=await setup({grant:true,seed});await page.goto(origin);await noPixel(page,id);await context.close();});
    await run('blocked consent storage fails closed',async()=>{const{context,page,id}=await setup({seed:'storage-blocked'});await page.goto(origin);await page.getByRole('button',{name:'Allow advertising',exact:true}).click();await expect(page.getByRole('dialog',{name:'Advertising preferences'}).getByRole('alert')).toContainText('could not be saved');await noPixel(page,id);await context.close();});
    await run('unapproved referrer suppresses SDK',async()=>{const{context,page,id}=await setup({grant:true});await page.goto(origin,{referer:origin+'/records?synthetic=private'});await noPixel(page,id);await context.close();});
    for(const target of ['/login','/register','/appointments?triage_session=5','/payments','/records','/messages','/triage','/profile','/referrals','/privacy/advertising'])await run(`restricted direct entry ${target.split('?')[0]}`,async()=>{const{context,page,id}=await setup({grant:true,account:!['/login','/register'].includes(target)});await page.goto(origin+target);await noPixel(page,id);await context.close();});
    await run('cross-root navigation clears SDK; application navigation preserves document',async()=>{const{context,page,id}=await setup({grant:true});await page.goto(origin);await expect.poll(()=>events(id).length,{timeout:15000}).toBe(1);const marketingDoc=await page.evaluate(()=>window.__qaDocument);await page.locator('a[href="/login"]').first().click();await expect(page).toHaveURL(origin+'/login');await settle(page);expect(await page.evaluate(()=>window.__qaDocument)).not.toBe(marketingDoc);expect(await page.evaluate(()=>typeof window.fbq)).toBe('undefined');const appDoc=await page.evaluate(()=>window.__qaDocument);await page.getByRole('link',{name:'Create account',exact:true}).click();await expect(page).toHaveURL(origin+'/register');expect(await page.evaluate(()=>window.__qaDocument)).toBe(appDoc);await page.goBack();await expect(page).toHaveURL(origin+'/login');expect(events(id)).toHaveLength(1);expect(await page.evaluate(()=>typeof window.fbq)).toBe('undefined');await context.close();});
    await run('synthetic email authentication and application provider continuity',async()=>{const{context,page,id}=await setup({grant:true});await page.goto(origin+'/login');await page.getByRole('textbox',{name:/Email/}).fill('synthetic@example.test');await page.getByPlaceholder('Enter your password').fill('SyntheticOnly123!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(origin+'/dashboard');await settle(page);expect(await page.evaluate(()=>sessionStorage.getItem('caretekk:auth-user')!==null)).toBe(true);expect(meta(id)).toHaveLength(0);expect(await page.evaluate(()=>typeof window.fbq)).toBe('undefined');await page.screenshot({path:`${output}/synthetic-auth-dashboard.png`});await context.close();});
    await run('privacy preferences preserve auth and recovery state',async()=>{const{context,page,id}=await setup({grant:true,account:true,seed:'recovery'});await page.goto(origin+'/privacy/advertising');await page.getByRole('button',{name:'Advertising preferences',exact:true}).click();await page.getByRole('button',{name:'Reject / withdraw',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('caretekk:founder50:v1:synthetic'))).toBe('synthetic recovery');expect((await context.cookies()).some(c=>c.name==='caretekk_session')).toBe(true);await noPixel(page,id);await page.screenshot({path:`${output}/privacy-notice.png`,fullPage:true});await context.close();});
  }
  if(phase==='on')await run('cross-tab withdrawal discards background runtime',async()=>{
    const{context,page,id}=await setup({grant:true});await page.goto(origin);await expect.poll(()=>events(id).length,{timeout:15000}).toBe(1);
    const other=await context.newPage();await other.goto(origin+'/privacy/advertising');await settle(other);
    await other.getByRole('button',{name:'Advertising preferences',exact:true}).click();await other.getByRole('button',{name:'Reject / withdraw',exact:true}).click();
    await page.bringToFront();await expect.poll(()=>runtimeState(page),{timeout:10000}).toBe('undefined');expect(events(id)).toHaveLength(1);await context.close();
  });
  if(phase==='on')await run('expired consent discards runtime without another event',async()=>{
    const{context,page,id}=await setup({grant:true});await page.goto(origin);await expect.poll(()=>events(id).length,{timeout:15000}).toBe(1);
    await page.evaluate(({key,ttl})=>{const expiresAt=Date.now()-1;localStorage.setItem(key,JSON.stringify({v:1,advertising:'granted',decidedAt:expiresAt-ttl,expiresAt}));},{key,ttl});
    await expect.poll(()=>runtimeState(page),{timeout:10000}).toBe('undefined');expect(events(id)).toHaveLength(1);await context.close();
  });
  expect(evidence.unexpected).toEqual([]);expect(evidence.consoleErrors).toEqual([]);
  saveIsolation(`${phase}-network.json`);
  console.log('PASS browser cases',results.length);
} catch(error) {
  fs.writeFileSync(`${output}/${phase}-failure.json`,JSON.stringify({case:current,error:error.message,results,unexpected:evidence.unexpected,consoleErrors:evidence.consoleErrors},null,2));
  throw error;
} finally {await browser.close();}
