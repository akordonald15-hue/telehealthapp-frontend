import json
import subprocess
from pathlib import Path

root = Path("artifacts/release-review")
before = json.loads(Path("artifacts/hero-review/npm-audit.json").read_text(encoding="utf-8-sig"))
old = json.loads(subprocess.check_output(["git", "show", "93515ad:package-lock.json"], text=True))["packages"]
new = json.loads(Path("package-lock.json").read_text(encoding="utf-8"))["packages"]
after = json.loads((root / "audit-after.json").read_text(encoding="utf-8-sig"))
notes = {
    "@babel/core": "Build/test: untrusted sourceMappingURL can read files; no application route invokes Babel. Compatible 7.x update.",
    "@humanfs/node": "Lint tooling: copying hostile symlinks can escape the source tree. Compatible update.",
    "@next/eslint-plugin-next": "Lint tooling: inherited braces pattern DoS. Keep paired Next 16.4 config; no compatible chain fix.",
    "@vitest/mocker": "Test tooling: file read needs exposed mocker/interceptor WebSocket or authorized RPC; jsdom run mode here. Patched at 4.1.11.",
    "baseline-browser-mapping": "Framework metadata/build: invalid caller query can terminate process; no route accepts this input. Compatible update.",
    "brace-expansion": "Tooling: hostile glob/range input can exhaust CPU/memory/stack. Updated to patched compatible branches.",
    "braces": "Lint tooling: deep hostile brace patterns exhaust stack. No application import found. No patched release exists.",
    "browserslist": "Build/test: hostile query/custom stats can cause OOM/crash/prototype writes. Compatible 4.x update.",
    "eslint-config-next": "Lint tooling: inherited braces chain. Reject forced 14.x downgrade; retain paired 16.4 config.",
    "fast-glob": "Lint tooling: inherited braces/micromatch DoS requires hostile patterns. No compatible chain fix.",
    "js-yaml": "Lint/config: hostile aliases/merge keys exhaust CPU. No YAML-upload parser in app. Compatible 4.x update.",
    "micromatch": "Lint tooling: inherited braces DoS requires hostile patterns. No compatible chain fix.",
    "next": "Production framework: App Router/image optimization used; server/RSC/cache/image issues have conditional exposure. Windows RCE applies to affected Windows-hosted servers. CSP nonces, custom servers, next/og and Server Actions not found. Deployed config unverified. Same-major 16.4.0 update.",
    "postcss": "CSS build pipeline: hostile CSS/maps can disclose files or create unsafe output. No request-time CSS parser found. Compatible 8.x and Next-pinned copy updates.",
    "sharp": "Production image optimizer: native decoder issues may affect malicious images. Local portraits/allowed Unsplash input do not establish immunity. Updated through Next to 0.35.5.",
    "source-map-js": "Source-map tooling: malformed indexed map offsets can stall event loop. Compatible 1.2.2 update.",
    "tinypool": "Test tooling: prototype pollution plus hostile worker/run options can execute code. Removed by assessed Vitest 4 migration.",
    "vitest": "Test tooling: critical umbrella includes pool; mocker read has dev-server/RPC preconditions. No public Vitest service configured. Assessed 3.2.7 to 4.1.11 migration.",
}
out = """# Dependency security assessment — 8 October 2026

Before: 18 affected package findings (3 critical, 11 high, 3 moderate, 1 low). These are not 18 independent vulnerabilities: parent packages inherit shared chains and packages can contain multiple advisories. After updates: **5 high development-tool findings**. Production-only audit: **0**. This is registry evidence for the lockfile, not proof of vulnerability-free code.

| Package | Previous severity | Locked before → after | Exposure, exploitability and fix | Remaining |
|---|---|---|---|---|
"""
for name, finding in before["vulnerabilities"].items():
    path = "node_modules/" + name
    previous = old.get(path, {}).get("version", "unknown")
    current = new.get(path, {}).get("version", "removed")
    remaining = "high" if name in after["vulnerabilities"] else "not reported"
    out += f"| `{name}` | {finding['severity']} | {previous} → {current} | {notes[name]} | {remaining} |\n"
out += """
## Decisions and residual risk

Next.js and eslint-config-next are paired at 16.4.0. No forced updates, overrides, vendor patches or framework major changes were used. [Next release](https://github.com/vercel/next.js/releases/tag/v16.4.0). The affected Windows-hosted RCE has no workaround; its patch is covered by this upgrade. [Advisory](https://github.com/advisories/GHSA-p293-qw3h-jr36).

Vitest 3 → 4 is an intentional test-only major migration. Reviewed the [v4 migration guide](https://v4.vitest.dev/guide/migration): engines, mocking/constructors, module runner, pool options, includes/excludes and coverage. Existing tests do not mock constructors, use custom poolOptions, configure coverage, or import removed runner APIs. Setup/include/aliases are retained. Node 24.19.0 meets engine requirements; 4.1.11 patches mocker and has no Tinypool dependency. Full-suite and focused-repeat results supply regression evidence. [Mocker advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [Tinypool advisory](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3).

Compatible fixes used `npm audit fix --package-lock-only --ignore-scripts`. Five remaining high findings form one unpatched chain: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. [Upstream reports no patched braces release](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). npm's forced downgrade to eslint-config-next 14.2.35 is unsuitable for Next 16.

Residual exposure is development/CI tooling receiving attacker-controlled glob patterns; no application import or public pattern-processing route was found. Keep CI on repository-defined commands and do not expose lint services or accept arbitrary external patterns. Explicitly accept the residual tooling risk or hold for an upstream fix. Do not claim a clean full audit. Deploy production dependencies only; verify CI/host Node compatibility, OS, environment, caching/auth and provider configuration in staging. Production configuration and live exploitability were not tested.

All direct advisories under the 18 findings (every Next, brace-expansion, js-yaml, sharp and PostCSS entry included) remain in `../hero-review/npm-audit.json` with GHSA URLs, affected ranges and CVSS. Parent-only entries show the dependency chain. Final registry evidence: `audit-after.json`, `audit-production.json`. Update/install evidence: `lock-update.txt`, `audit-fix.txt`, `install.txt`. This table classifies each package finding; raw reports provide the complete advisory detail.
"""
(root / "dependency-assessment.md").write_text(out, encoding="utf-8")
