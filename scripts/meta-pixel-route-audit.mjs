// One-time source-preservation audit, independent of CI's shallow checkout.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base='0ddc87dbeabca0f2c3b15b3c6ae88ef94259dc61';
const normalized=value=>value.toString().replaceAll('\r\n','\n');
const original=path=>execFileSync('git',['show',`${base}:${path}`]);
const paths=execFileSync('git',['ls-tree','-r','--name-only',base,'src/app'],{encoding:'utf8'}).trim().split(/\r?\n/);
const groups=['(app)','(auth)','onboarding','r','dasbooard','offline'];
const moved=paths.filter(path=>groups.some(group=>path.startsWith(`src/app/${group}/`)));
assert(moved.length>30);
for(const file of moved)assert.equal(normalized(readFileSync(file.replace('src/app/','src/app/(site)/'))),normalized(original(file)),file);
assert.equal(normalized(readFileSync('src/app/(marketing)/page.tsx')),normalized(original('src/app/page.tsx')));
assert.equal(normalized(readFileSync('src/app/document.tsx')),normalized(original('src/app/layout.tsx')).replace('function RootLayout','function DocumentShell'));
console.log(`PASS release audit: ${moved.length} moved files, homepage and document shell preserved (checkout line endings normalized)`);
