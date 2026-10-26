"""Verify the separately committed request synchronization; never alter assertions."""
import pathlib, subprocess
relative = 'scripts/founder50-remediation-qa.mjs'
current = pathlib.Path(relative).read_bytes()
pinned = subprocess.check_output(['git', 'show', '8d30c0c8375348b69ca2dcf24dc47a778860350d:' + relative])
assert current == pinned, 'QA harness differs from pinned source'
assert current.count(b'    await expect.poll(()=>posts.length).toBe(2);') == 1
assert current.count(b'    expect(posts[1].idempotency_key).not.toBe(posts[0].idempotency_key);') == 1
print('Verified committed second-request synchronization and original key assertion; no harness mutation')
