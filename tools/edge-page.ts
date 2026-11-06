export type EdgePageOptions = {
  /** Shown in the footer; useful when demoing. */
  originPort: number;
};

/**
 * Served by the proxy itself with a real 503. It deliberately does not depend
 * on the shell: if the shell is the thing that failed, this page still works.
 * The markup mirrors the design tokens closely enough to feel native.
 */
export function renderEdgePage({ originPort }: EdgePageOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Temporarily unavailable · Relay</title>
<style>
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f4f0;background-image:radial-gradient(1100px 520px at 8% -12%,rgba(207,74,12,.06),transparent 62%);color:#1a1613;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
.card{width:100%;max-width:560px;background:#fff;border:1px solid #e6dfd5;border-radius:16px;padding:32px;box-shadow:0 1px 2px rgba(26,22,19,.04),0 18px 48px -24px rgba(26,22,19,.28)}
.brand{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-.02em}
.mark{width:32px;height:32px;border-radius:10px;background:#1a1613;display:grid;place-items:center;color:#fff}
.badge{display:inline-flex;align-items:center;gap:6px;margin-top:28px;padding:3px 8px;border-radius:999px;background:#fbf0d9;color:#946000;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;border:1px solid rgba(148,96,0,.2)}
h1{margin:12px 0 0;font-size:26px;line-height:1.2;letter-spacing:-.03em}
p{margin:10px 0 0;color:#5c534a;font-size:14px;line-height:1.6}
.actions{margin-top:24px;display:flex;gap:10px;flex-wrap:wrap}
a.primary{display:inline-flex;align-items:center;height:38px;padding:0 16px;border-radius:999px;background:#1a1613;color:#fff;text-decoration:none;font-size:13px;font-weight:500}
a.secondary{display:inline-flex;align-items:center;height:38px;padding:0 16px;border-radius:999px;border:1px solid #d3c9bc;background:#fff;color:#1a1613;text-decoration:none;font-size:13px;font-weight:500}
.footer{margin-top:24px;padding-top:16px;border-top:1px solid #e6dfd5;color:#8b8176;font-size:11px}
</style>
</head>
<body>
<main class="card">
  <div class="brand">
    <span class="mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h9.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M11.5 6.5 18 12l-6.5 5.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4.5" cy="12" r="2.1" fill="#FB923C"/></svg></span>
    Relay
    <span style="font-weight:400;color:#8b8176;font-size:10px;text-transform:uppercase;letter-spacing:.16em">Delivery platform</span>
  </div>
  <span class="badge">503 · upstream unavailable</span>
  <h1>This area is temporarily unavailable.</h1>
  <p>The zone that serves this path did not respond. The rest of Relay is still running, and every other zone is unaffected.</p>
  <p>This page is served by the edge, so it stays up even when the application behind it cannot be reached.</p>
  <div class="actions">
    <a class="primary" href="/">Back to overview</a>
    <a class="secondary" href="">Try again</a>
  </div>
  <div class="footer">Independent deploy · isolated failure · edge-503 · origin :${originPort}</div>
</main>
</body>
</html>`;
}
