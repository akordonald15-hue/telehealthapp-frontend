// Test-only browser boundary. No production credentials, endpoints or writes are used.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const origin = 'https://www.caretekk.com';
const loopback = process.env.QA_BASE_URL || 'http://127.0.0.1:3118';
if (new URL(loopback).hostname !== '127.0.0.1') throw Error('QA server must be IPv4 loopback');
if (process.env.QA_LOCAL_BACKEND_FIXTURE || process.env.QA_REAL_PAID || process.env.QA_REAL_RECOVERY) throw Error('Real backend fixtures prohibited');
const output = process.env.QA_OUTPUT_DIR || 'artifacts/meta-pixel-browser-20261116';
fs.mkdirSync(output, {recursive:true});
const sdk = fs.readFileSync(path.join(output, 'fbevents.js.txt'), 'utf8');
export const evidence = { startedAt:new Date().toISOString(), loopback, contexts:[], network:[], unexpected:[], consoleErrors:[] };
const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export async function protectContext(context) {
  const id = evidence.contexts.length + 1;
  evidence.contexts.push({id, serviceWorkers:'blocked', proxy:'unreachable-loopback; loopback bypass only', resolver:'external DNS disabled'});
  await context.exposeBinding('__qaPageShown', (_source, state) => { evidence.contexts[id-1].pageShows ||= []; evidence.contexts[id-1].pageShows.push(state); });
  await context.addInitScript(() => { if(['http:','https:'].includes(location.protocol)) window.__qaDocument = crypto.randomUUID(); });
  await context.addInitScript(() => {
    addEventListener('pageshow', event => { if(['http:','https:'].includes(location.protocol)) window.__qaPageShown({path:location.pathname,persisted:event.persisted,online:navigator.onLine,visibility:document.visibilityState}).catch(()=>{}); });
  });
  await context.routeWebSocket('**/*', socket => {
    evidence.unexpected.push({context:id,kind:'websocket',destination:new URL(socket.url()).origin}); socket.close();
  });
  context.on('page', page => {
    page.on('pageerror', error => evidence.consoleErrors.push({context:id,name:error.name,message:error.message.slice(0,300)}));
    page.on('console', message => {
      if(message.type()==='error' && !/Content Security Policy|Content-Security-Policy|ERR_BLOCKED_BY_CLIENT|Failed to load resource/.test(message.text())) {
        evidence.consoleErrors.push({context:id,name:'console',message:message.text().replace(/https?:\/\/[^\s"']+/g,'[URL]').slice(0,300)});
      }
    });
  });
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    const meta = url.hostname === 'connect.facebook.net' || url.hostname === 'www.facebook.com' || url.hostname === 'facebook.com';
    if(meta) {
      const fields = new URLSearchParams(url.search);
      if(request.postData()) for(const [key,value] of new URLSearchParams(request.postData())) fields.set(key,value);
      const document = request.frame().url();
      const item = {context:id,kind:'meta',host:url.hostname,path:url.pathname,method:request.method(),event:fields.get('ev'),documentPath:new URL(document).pathname,documentQueryKeys:[...new URL(document).searchParams.keys()],fieldNames:[...fields.keys()],location:fields.get('dl'),referrer:fields.get('rl'),action:'intercepted-locally'};
      evidence.network.push(item);
      if(url.href === 'https://connect.facebook.net/en_US/fbevents.js') return route.fulfill({status:200,contentType:'application/javascript',body:sdk});
      if(url.hostname === 'connect.facebook.net' && url.pathname === '/signals/config/123456789') return route.fulfill({status:200,contentType:'application/javascript',body:'/* Synthetic configuration completion: no account-side plugins, matching, restrictions or production configuration. */ window.fbq.instance.configLoaded("123456789");'});
      if(url.pathname.replace(/\/$/,'') === '/tr' && fields.get('ev') === 'PageView') return route.fulfill({status:200,contentType:'image/gif',body:gif});
      evidence.unexpected.push({...item,location:undefined,referrer:undefined}); return route.abort('blockedbyclient');
    }
    const application = url.origin === origin || url.origin === new URL(loopback).origin;
    if(!application) {
      // Existing Google sign-in is not used in synthetic session-cookie tests.
      if(url.href === 'https://accounts.google.com/gsi/client') {
        evidence.network.push({context:id,kind:'google-script',host:url.hostname,path:url.pathname,action:'guard-aborted'});
        return route.abort('blockedbyclient');
      }
      evidence.unexpected.push({context:id,kind:'external',host:url.hostname,path:url.pathname,action:'guard-aborted'});
      return route.abort('blockedbyclient');
    }
    if(url.pathname.startsWith('/api/')) {
      // Regression harnesses register their exact synthetic API fixtures after this guard.
      evidence.unexpected.push({context:id,kind:'unmocked-api',path:url.pathname,method:request.method()});
      return route.abort('blockedbyclient');
    }
    if(!['GET','HEAD'].includes(request.method())) {
      evidence.unexpected.push({context:id,kind:'application-write',path:url.pathname}); return route.abort('blockedbyclient');
    }
    if(url.pathname === '/_next/image' && /^https?:/.test(url.searchParams.get('url')||'')) return route.fulfill({status:200,contentType:'image/gif',body:gif});
    try {
      const response = await route.fetch({url:loopback+url.pathname+url.search,maxRedirects:0,timeout:15000});
      const headers = {...response.headers()};
      if(headers.location?.startsWith(loopback)) headers.location = origin+headers.location.slice(loopback.length);
      return await route.fulfill({response,headers});
    } catch(error) {
      if(!/Fetch response has been disposed|Target page, context or browser has been closed|Request context disposed/.test(error.message))throw error;
      // Only verified loopback GET/HEAD requests reach this branch. Closing/reloading a test document cancels background prefetches.
      evidence.network.push({context:id,kind:'local-cancelled',path:url.pathname,action:'navigation-or-teardown'});
      await route.abort('aborted').catch(()=>{});
    }
  });
  return id;
}

const originalLaunch = chromium.launch.bind(chromium);
// Also supports the existing, unchanged CARE50/paid browser harness via node --import.
chromium.launch = async options => {
  const browser = await originalLaunch({...options,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'},args:[...(options?.args||[]),'--disable-background-networking','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost']});
  const originalContext = browser.newContext.bind(browser);
  browser.newContext = async options => {
    const context = await originalContext({...options,serviceWorkers:'block'});
    await protectContext(context); return context;
  };
  return browser;
};
export function saveIsolation(name) {
  fs.writeFileSync(path.join(output,name),JSON.stringify({...evidence,endedAt:new Date().toISOString()},null,2));
  if(evidence.unexpected.length) throw Error(`Isolation audit failed: ${evidence.unexpected.length} unexpected requests`);
}
process.on('exit', () => fs.writeFileSync(path.join(output,`isolation-${process.env.QA_EVIDENCE_LABEL||'browser'}.json`),JSON.stringify(evidence,null,2)));
