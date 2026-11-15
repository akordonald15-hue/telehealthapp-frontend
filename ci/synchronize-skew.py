"""Verify the separately committed request synchronization; never alter assertions."""
import pathlib, subprocess
relative = 'scripts/founder50-remediation-qa.mjs'
current = pathlib.Path(relative).read_bytes()
pinned = subprocess.check_output(['git', 'show', 'd1ad699b8cb9971a3a28900ed38b7f53ac15d9f4:' + relative])
assert current == pinned, 'QA harness differs from pinned source'
assert current.count(b'    await expect.poll(()=>posts.length).toBe(2);') == 1
assert current.count(b'    expect(posts[1].idempotency_key).not.toBe(posts[0].idempotency_key);') == 1
print('Verified committed second-request synchronization and original key assertion; no harness mutation')
