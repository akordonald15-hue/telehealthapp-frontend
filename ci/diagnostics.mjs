// Authorized isolated CI diagnostics only; never imported by application code.
// Import AFTER the unchanged network audit, before the existing QA harness.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(path.join(process.env.APP_DIR,'package.json'));
const {chromium}=require('@playwright/test');
const launch=chromium.launch.bind(chromium);
let sequence=0;
chromium.launch=async options=>{
  const browser=await launch(options);
  const active=new Set();
  const newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{
    const context=await newContext(options);
    const dir=path.join(process.env.QA_OUTPUT_DIR,`context-${++sequence}`);
    fs.mkdirSync(dir,{recursive:true});
    const events=[];
    const record=data=>{
      events.push({utc:new Date().toISOString(),...data});
      fs.writeFileSync(path.join(dir,'events.json'),JSON.stringify(events,null,2));
    };
    await context.tracing.start({screenshots:true,snapshots:true,sources:false});
    // Test-browser CSP only. No external request is fulfilled or whitelisted.
    // Only loopback document responses are fetched; API fixture routes remain unchanged.
    await context.route('**/*',async route=>{
      const request=route.request();
      const u=new URL(request.url());
      if(request.resourceType()!=='document'||u.origin!==process.env.QA_BASE_URL)
        return route.fallback();
      const response=await route.fetch({maxRedirects:0});
      return route.fulfill({response,headers:{...response.headers(),
        'content-security-policy':"script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws://127.0.0.1:9; object-src 'none'"}});
    });
    context.on('response',async response=>{
      record({kind:'response',url:response.url(),status:response.status()});
      if(new URL(response.url()).pathname==='/api/auth/me/'){
        try{
          const body=await response.json();
          // Only the role/verification shape; no user identifiers or raw body.
          record({kind:'auth-result',status:response.status(),role:body?.role,
            verified:body?.is_email_verified,hasPatientRole:body?.role==='patient'});
        }catch(error){record({kind:'auth-response-error',message:error.message});}
      }
    });
    context.on('requestfailed',request=>record({kind:'requestfailed',url:request.url(),error:request.failure()}));
    context.on('page',page=>{
      page.on('console',msg=>record({kind:'console',level:msg.type(),text:msg.text()}));
      page.on('pageerror',error=>record({kind:'pageerror',message:error.message}));
    });
    let closed=false;
    const close=context.close.bind(context);
    context.close=async()=>{
      if(closed)return;
      closed=true;
      try{
        for(const [index,page] of context.pages().entries()){
          if(page.isClosed())continue;
          record({kind:'final-page',url:page.url(),text:await page.locator('body').innerText({timeout:5000}).catch(()=>'<unavailable>')});
          await page.screenshot({path:path.join(dir,`page-${index}.png`),fullPage:true,timeout:5000}).catch(error=>record({kind:'screenshot-error',message:error.message}));
        }
        await context.tracing.stop({path:path.join(dir,'trace.zip')});
      }finally{active.delete(context);await close();}
    };
    active.add(context);
    return context;
  };
  const close=browser.close.bind(browser);
  browser.close=async()=>{
    try{for(const context of [...active])await context.close();}
    finally{await close();}
  };
  return browser;
};
