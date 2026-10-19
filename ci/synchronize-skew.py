"""Apply the approved test-only synchronization to the pinned QA harness."""
import pathlib, subprocess

relative = 'scripts/founder50-remediation-qa.mjs'
target = pathlib.Path(relative)
pinned = subprocess.check_output(['git', 'show', '5052545d93ce58cf1cffe9d8472d03da2e6b6819:' + relative])
current = target.read_bytes()
if current != pinned:
    raise RuntimeError('QA harness differs from pinned source; refusing correction')
old = b'    expect(posts[1].idempotency_key).not.toBe(posts[0].idempotency_key);'
new = b'    await expect.poll(()=>posts.length).toBe(2);\n' + old
if current.count(old) != 1:
    raise RuntimeError('Expected exactly one skew assertion')
target.write_bytes(current.replace(old, new))
print('Applied only second-request synchronization; original key assertion preserved')
