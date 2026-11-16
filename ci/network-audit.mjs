import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(path.join(process.env.APP_DIR,'package.json'));
const {chromium}=require('@playwright/test');
const audit=[];
let unexpected=false;
const external=new Map();
const allowed=url=>{
  const u=new URL(url);
  return ['http:','https:'].includes(u.protocol) &&
    ['127.0.0.1','localhost','[::1]'].includes(u.hostname);
};
const launch=chromium.launch.bind(chromium);
chromium.launch=async options=>{
  const browser=await launch(options);
  const newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{
    const context=await newContext({...options,serviceWorkers:'block'});
    context.on('request',request=>{
      const u=new URL(request.url());
      const ok=allowed(request.url());
      audit.push({method:request.method(),origin:u.origin,path:u.pathname,loopback:ok});
      if(!ok)external.set(request,{method:request.method(),origin:u.origin,path:u.pathname,outcome:'unknown'});
    });
    context.on('requestfailed',request=>{
      const entry=external.get(request);
      if(entry && request.failure()?.errorText==='csp')entry.outcome='CSP-blocked';
    });
    context.on('response',response=>{
      const entry=external.get(response.request());
      if(entry){entry.outcome='external-response';unexpected=true;}
    });
    await context.route('**/*',route=>{
      if(allowed(route.request().url()))return route.continue();
      const entry=external.get(route.request());
      if(entry)entry.outcome='guard-aborted';
      return route.abort();
    });
    await context.routeWebSocket('**/*',ws=>{
      audit.push({websocket:true,urlHost:new URL(ws.url()).hostname,blocked:true});
      if(!['127.0.0.1','localhost','[::1]'].includes(new URL(ws.url()).hostname))unexpected=true;
      ws.close({code:1008,reason:'Synthetic acceptance: no external socket'});
    });
    return context;
  };
  return browser;
};
process.on('exit',()=>{
  for(const entry of external.values()){
    audit.push(entry);
    if(!['CSP-blocked','guard-aborted'].includes(entry.outcome))unexpected=true;
  }
  fs.mkdirSync(process.env.QA_OUTPUT_DIR,{recursive:true});
  fs.writeFileSync(path.join(process.env.QA_OUTPUT_DIR,'network-audit.json'),JSON.stringify(audit,null,2));
  if(unexpected)process.exitCode=1;
});
