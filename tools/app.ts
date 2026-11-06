import { execFileSync, spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { allApps, zoneById, type ZoneDefinition } from "@micro/routing";
import { renderCaddyfile } from "./caddyfile";

const ROOT = path.resolve(import.meta.dirname, "..");
const RUN_DIR = path.join(ROOT, ".run");
const CADDYFILE = path.join(RUN_DIR, "Caddyfile");
const ORIGIN_PORT = 3000;

type AppDef = ReturnType<typeof allApps>[number];
type Mode = "dev" | "prod";

const APPS = allApps();

function gitSha(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

const SHA = gitSha();

function buildInfo(mode: Mode): string {
  if (mode === "dev") return `${SHA}+dev`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
  return `${SHA}+${stamp}`;
}

function findApp(name: string): AppDef {
  const app = APPS.find((candidate) => candidate.app === name || candidate.id === name);
  if (!app) {
    throw new Error(
      `Unknown app "${name}". Known apps: ${APPS.map((candidate) => candidate.app).join(", ")}`,
    );
  }
  return app;
}

function pidFile(app: string) {
  return path.join(RUN_DIR, `${app}.pid`);
}

function infoFile(app: string) {
  return path.join(RUN_DIR, `${app}.info.json`);
}

function logFile(app: string) {
  return path.join(RUN_DIR, `${app}.log`);
}

function readPid(app: string): number | null {
  try {
    const pid = Number(fs.readFileSync(pidFile(app), "utf8").trim());
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

function readInfo(app: string): { mode?: string; buildInfo?: string; startedAt?: string } | null {
  try {
    return JSON.parse(fs.readFileSync(infoFile(app), "utf8"));
  } catch {
    return null;
  }
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isRunning(app: string): boolean {
  const pid = readPid(app);
  return pid !== null && alive(pid);
}

function commandFor(app: AppDef, mode: Mode): { bin: string; args: string[] } {
  if (app.framework === "next") {
    return {
      bin: "next",
      args: [mode === "dev" ? "dev" : "start", "-p", String(app.port)],
    };
  }

  if (app.framework === "vite") {
    return mode === "dev"
      ? { bin: "vite", args: ["--port", String(app.port), "--strictPort"] }
      : { bin: "vite", args: ["preview", "--port", String(app.port), "--strictPort"] };
  }

  return {
    bin: "tsx",
    args: mode === "dev" ? ["watch", "src/index.ts"] : ["src/index.ts"],
  };
}

function upstreamPath(app: AppDef): string {
  if (app.id === "mock-api") return "/api/health";
  const zone = zoneById(app.id) as ZoneDefinition;
  if (zone.path === "/") return "/";
  return `${zone.path}${zone.framework === "vite" ? "/" : ""}`;
}

async function waitFor(name: string, url: string, timeoutMs = 120_000): Promise<void> {
  const started = Date.now();
  let lastError = "";
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(3_000),
      });
      if (response.status < 500) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(250);
  }
  throw new Error(`${name} did not become ready at ${url} (${lastError})`);
}

function pump(child: ChildProcess, app: string) {
  const log = fs.createWriteStream(logFile(app), { flags: "a" });
  const prefix = `[${app}] `;
  const handle = (chunk: Buffer) => {
    log.write(chunk);
    for (const line of chunk.toString().split("\n")) {
      if (line.trim()) process.stdout.write(prefix + line + "\n");
    }
  };
  child.stdout?.on("data", handle);
  child.stderr?.on("data", handle);
}

function startApp(
  app: AppDef,
  mode: Mode,
  { stream, infoOverride }: { stream: boolean; infoOverride?: string },
): ChildProcess {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  const command = commandFor(app, mode);
  const info = infoOverride ?? buildInfo(mode);

  fs.appendFileSync(
    logFile(app.app),
    `\n--- ${new Date().toISOString()} ${mode} ${info} ---\n`,
  );

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    BUILD_INFO: info,
    ...(app.framework === "node" ? { PORT: String(app.port) } : {}),
  };

  const fd = stream ? null : fs.openSync(logFile(app.app), "a");
  const child = spawn("pnpm", ["--filter", app.app, "exec", command.bin, ...command.args], {
    cwd: ROOT,
    detached: true,
    env,
    stdio: stream ? "pipe" : ["ignore", fd as number, fd as number],
  });
  if (fd !== null) fs.closeSync(fd);
  if (!child.pid) throw new Error(`Failed to spawn ${app.app}`);

  fs.writeFileSync(pidFile(app.app), String(child.pid));
  fs.writeFileSync(
    infoFile(app.app),
    JSON.stringify(
      {
        app: app.app,
        mode,
        buildInfo: info,
        startedAt: new Date().toISOString(),
        pid: child.pid,
      },
      null,
      2,
    ),
  );

  if (stream) {
    pump(child, app.app);
  } else {
    child.unref();
  }

  child.on("exit", (code, signal) => {
    if (readPid(app.app) === child.pid) fs.rmSync(pidFile(app.app), { force: true });
    if (stream) process.stdout.write(`[${app.app}] exited (${signal ?? code})\n`);
  });

  return child;
}

async function stopByName(name: string): Promise<boolean> {
  const pid = readPid(name);
  if (!pid) return false;
  if (!alive(pid)) {
    fs.rmSync(pidFile(name), { force: true });
    return false;
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // already gone
    }
  }

  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline && alive(pid)) {
    await sleep(150);
  }

  if (alive(pid)) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      // ignore
    }
  }

  fs.rmSync(pidFile(name), { force: true });
  return true;
}

async function stopAll(): Promise<void> {
  const names = [...APPS.map((app) => app.app), "proxy"];
  const stopped = await Promise.all(names.map((name) => stopByName(name)));
  const count = stopped.filter(Boolean).length;
  if (count) console.log(`Stopped ${count} process${count === 1 ? "" : "es"}.`);
  fs.rmSync(CADDYFILE, { force: true });
}

function assertCaddy(): void {
  const result = spawnSync("caddy", ["version"], { stdio: "ignore" });
  if (result.status !== 0) {
    throw new Error(
      "caddy is not installed. On macOS: brew install caddy. On Debian: see https://caddyserver.com/docs/install",
    );
  }
}

async function waitForEdge(timeoutMs = 15_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      await fetch(`http://localhost:${ORIGIN_PORT}/`, {
        redirect: "manual",
        signal: AbortSignal.timeout(1_500),
      });
      return;
    } catch {
      await sleep(200);
    }
  }
  throw new Error(`The edge did not start on port ${ORIGIN_PORT}`);
}

async function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(700, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * An abruptly killed dev session can leave Caddy holding :3000 with an old
 * routing table. Without this check, the new session would start apps and then
 * silently reuse the stale edge, producing confusing 404s.
 */
async function ensurePortFree(port: number): Promise<void> {
  if (!(await portInUse(port))) return;

  spawnSync("pkill", ["-f", `caddy run --config ${CADDYFILE}`]);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!(await portInUse(port))) return;
    await sleep(150);
  }

  throw new Error(
    `Port ${port} is still in use. Stop the process holding it and run pnpm dev again.`,
  );
}

async function startProxy(): Promise<void> {
  assertCaddy();
  fs.mkdirSync(RUN_DIR, { recursive: true });
  fs.writeFileSync(CADDYFILE, renderCaddyfile({ originPort: ORIGIN_PORT }));

  const previous = readPid("proxy");
  if (previous && alive(previous)) {
    await stopByName("proxy");
  }

  await ensurePortFree(ORIGIN_PORT);

  const fd = fs.openSync(logFile("proxy"), "a");
  const child = spawn(
    "caddy",
    ["run", "--config", CADDYFILE, "--adapter", "caddyfile"],
    {
      cwd: ROOT,
      detached: true,
      stdio: ["ignore", fd, fd],
    },
  );
  fs.closeSync(fd);

  if (!child.pid) throw new Error("Failed to start caddy");
  fs.writeFileSync(pidFile("proxy"), String(child.pid));
  child.unref();

  await waitForEdge();
}

function printReady(): void {
  console.log("");
  console.log(`  Relay is running at http://localhost:${ORIGIN_PORT}`);
  console.log("");
  for (const app of APPS) {
    const route =
      app.id === "mock-api" ? "/api" : (zoneById(app.id) as ZoneDefinition).path;
    const label = app.app.padEnd(14);
    console.log(`  ${label} ${route.padEnd(12)} :${app.port}`);
  }
  console.log("");
  console.log("  Demo commands:");
  console.log("    pnpm ship zone-catalog   rebuild and restart one zone only");
  console.log("    pnpm stop zone-ops       take one zone down; the edge serves a 503");
  console.log("    pnpm start zone-ops      bring it back in dev mode");
  console.log("    pnpm status              show pids, builds and health");
  console.log("    pnpm stop                stop everything");
  console.log("");
}

async function dev(): Promise<void> {
  await stopAll();
  console.log(`Starting ${APPS.length} apps + edge...`);

  const children = APPS.map((app) => startApp(app, "dev", { stream: true }));

  try {
    await Promise.all(
      APPS.map((app) =>
        waitFor(app.app, `http://localhost:${app.port}${upstreamPath(app)}`),
      ),
    );

    await startProxy();
  } catch (error) {
    for (const child of children) child.kill("SIGTERM");
    await stopAll();
    throw error;
  }

  printReady();

  const shutdown = async () => {
    console.log("\nShutting down...");
    for (const child of children) child.kill("SIGTERM");
    await stopAll();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function startOne(name: string): Promise<void> {
  const app = findApp(name);
  if (isRunning(app.app)) {
    console.log(`${app.app} is already running.`);
    return;
  }

  startApp(app, "dev", { stream: false });
  await waitFor(app.app, `http://localhost:${app.port}${upstreamPath(app)}`);
  console.log(`Started ${app.app} on :${app.port} (logs: .run/${app.app}.log)`);

  if (!isRunning("proxy")) {
    console.log("Edge was not running; starting it now.");
    await startProxy();
    printReady();
  }
}

async function stopCommand(name?: string): Promise<void> {
  if (!name || name === "all") {
    await stopAll();
    return;
  }
  const app = findApp(name);
  const stopped = await stopByName(app.app);
  console.log(
    stopped
      ? `Stopped ${app.app}. Requests to it now return the edge 503 page. Restore with: pnpm start ${app.app}`
      : `${app.app} was not running.`,
  );
}

function runBuild(app: AppDef, info: string): void {
  if (app.framework === "node") return;
  console.log(`Building ${app.app} (${info})...`);
  const result = spawnSync("pnpm", ["--filter", app.app, "build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, BUILD_INFO: info },
  });
  if (result.status !== 0) {
    throw new Error(`Build failed for ${app.app}`);
  }
}

async function ship(name: string): Promise<void> {
  const app = findApp(name);
  const info = buildInfo("prod");

  // Stop before building: `next build` and `next dev` share `.next`, and a
  // production build racing a dev server is a bad time.
  await stopByName(app.app);

  try {
    runBuild(app, info);
  } catch (error) {
    console.error(
      `Build failed. ${app.app} is stopped. Restart it with: pnpm start ${app.app}`,
    );
    throw error;
  }

  if (!isRunning("proxy")) {
    await startProxy();
  }

  startApp(app, "prod", { stream: false, infoOverride: info });
  await waitFor(app.app, `http://localhost:${app.port}${upstreamPath(app)}`, 60_000);

  const publicPath = app.id === "mock-api" ? "/api" : (zoneById(app.id) as ZoneDefinition).path;
  console.log(`Shipped ${app.app} at ${info}. Only this app was rebuilt.`);
  console.log(`Live at http://localhost:${ORIGIN_PORT}${publicPath}`);
}

async function status(): Promise<void> {
  const proxyPid = readPid("proxy");
  const proxyUp = proxyPid !== null && alive(proxyPid);

  console.log("");
  console.log(
    `Edge  ${proxyUp ? "up" : "down"}  http://localhost:${ORIGIN_PORT}  ${proxyPid ? `pid ${proxyPid}` : ""}`,
  );
  console.log("");
  console.log("APP             STATE   MODE   BUILD                 PORT   HEALTH");
  for (const app of APPS) {
    const pid = readPid(app.app);
    const up = pid !== null && alive(pid);
    const info = readInfo(app.app);
    let health = "-";
    if (up) {
      try {
        const response = await fetch(
          `http://localhost:${app.port}${upstreamPath(app)}`,
          { signal: AbortSignal.timeout(1000), redirect: "manual" },
        );
        health = `HTTP ${response.status}`;
      } catch {
        health = "unreachable";
      }
    }
    console.log(
      `${app.app.padEnd(15)} ${(up ? "up" : "down").padEnd(7)} ${(info?.mode ?? "-").padEnd(6)} ${(info?.buildInfo ?? "-").padEnd(21)} ${String(app.port).padEnd(6)} ${health}`,
    );
  }
  console.log("");
}

async function main(): Promise<void> {
  const [command, argument] = process.argv.slice(2);

  switch (command) {
    case "dev":
      await dev();
      break;
    case "start":
      if (!argument) throw new Error("Usage: pnpm start <app>");
      await startOne(argument);
      break;
    case "stop":
      await stopCommand(argument);
      break;
    case "ship":
      if (!argument) throw new Error("Usage: pnpm ship <app>");
      await ship(argument);
      break;
    case "status":
      await status();
      break;
    default:
      console.log(`Usage:
  pnpm dev
  pnpm start <app>
  pnpm stop [app|all]
  pnpm ship <app>
  pnpm status`);
      process.exit(command ? 1 : 0);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
