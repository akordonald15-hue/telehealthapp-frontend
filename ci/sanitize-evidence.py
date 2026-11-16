"""Upload only sanitized synthetic diagnostics; raw evidence never uploaded."""
import json, pathlib, re, sys, zipfile

DENY = re.compile(r'cookie|authorization|token|password|secret|storageState|postData|requestBody|responseBody|headers', re.I)

def text(value):
    value = re.sub(r'(?i)\bBearer\s+[^\s"<>]+', '[REDACTED]', value)
    value = re.sub(r'(?i)caretekk_(?:session|access|refresh)[^\s"<>]*', '[REDACTED_COOKIE]', value)
    value = re.sub(r'(?i)(?:authorization|set-cookie|cookie)\s*[:=][^\r\n]*', '[REDACTED_HEADER]', value)
    value = re.sub(r'(?i)(https?://[^\s"<>?]+)\?[^\s"<>]*', r'\1?[REDACTED_QUERY]', value)
    return value

def clean(value):
    if isinstance(value, dict):
        # Request/response header tuples carry the sensitive key in 'name'.
        if isinstance(value.get('name'), str) and DENY.search(value['name']):
            return {'redacted': True}
        return {k: clean(v) for k, v in value.items() if not DENY.search(k)}
    if isinstance(value, list):
        return [clean(v) for v in value]
    return text(value) if isinstance(value, str) else value

def sanitize_bytes(name, data):
    if name.endswith(('.png', '.jpeg', '.jpg')):
        return data  # Only synthetic browser pages exist in the isolated namespace.
    decoded = data.decode('utf-8')  # Unknown binary format fails closed.
    if name.endswith(('.trace', '.network', '.stacks')):
        return ('\n'.join(json.dumps(clean(json.loads(line))) for line in decoded.splitlines() if line.strip())+'\n').encode()
    if name.endswith('.json'):
        return json.dumps(clean(json.loads(decoded)), indent=2).encode()
    return text(decoded).encode()

def main(source, destination):
    src, dst = pathlib.Path(source), pathlib.Path(destination)
    if dst.exists():
        raise RuntimeError('Refusing to overwrite sanitized evidence')
    dst.mkdir(parents=True)
    count = 0
    for item in sorted(src.rglob('*')):
        if not item.is_file():
            continue
        out = dst / item.relative_to(src)
        out.parent.mkdir(parents=True, exist_ok=True)
        if item.suffix == '.zip':
            with zipfile.ZipFile(item) as original, zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as archive:
                for name in original.namelist():
                    if name.endswith('/'):
                        continue
                    if pathlib.PurePosixPath(name).is_absolute() or '..' in pathlib.PurePosixPath(name).parts:
                        raise RuntimeError('Unsafe archive entry')
                    # Exclude opaque response-body/source resources entirely.
                    # DOM snapshots live in .trace; only synthetic screenshot images remain.
                    if not name.endswith(('.trace', '.network', '.stacks', '.png', '.jpeg', '.jpg')):
                        continue
                    archive.writestr(name, sanitize_bytes(name, original.read(name)))
        else:
            out.write_bytes(sanitize_bytes(item.name, item.read_bytes()))
        count += 1
    if not count:
        raise RuntimeError('No evidence to sanitize')
    (dst/'sanitization.json').write_text(json.dumps({'files':count,'headersCookiesBodiesExcluded':True,
        'sourcesCaptured':False,'data':'synthetic fixtures only; no production credentials or patient records'}))

if __name__ == '__main__':
    main(*sys.argv[1:])
