import { services, zoneById, zones } from "@micro/routing";
import { renderEdgePage } from "./edge-page";

export const DEV_USER = {
  id: "robin.vale",
  name: "Robin Vale",
  email: "robin.vale@example.com",
  groups: "platform,ops",
} as const;

function indent(text: string, prefix: string): string {
  return text
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : line))
    .join("\n");
}

function proxyBlock(port: number, indent = "\t\t"): string[] {
  return [
    `${indent}reverse_proxy localhost:${port} {`,
    `${indent}\theader_up X-Auth-Request-User "{auth_user}"`,
    `${indent}\theader_up X-Auth-Request-Email "{auth_email}"`,
    `${indent}\theader_up X-Auth-Request-Groups "{auth_groups}"`,
    `${indent}\theader_up X-Auth-Request-Preferred-Username "{auth_name}"`,
    `${indent}}`,
  ];
}

/**
 * Renders the local edge. It mirrors the production responsibility boundary:
 * routing, identity header injection, and an outage page that does not depend
 * on any application.
 */
export function renderCaddyfile({ originPort = 3000 }: { originPort?: number } = {}): string {
  const shell = zoneById("shell");
  const lines: string[] = [];

  lines.push("{");
  lines.push("\tadmin off");
  lines.push("\tauto_https off");
  lines.push("}");
  lines.push("");
  lines.push(`:${originPort} {`);

  // Never trust identity headers from the client; the edge is the only source.
  lines.push("\trequest_header -X-Auth-Request-User");
  lines.push("\trequest_header -X-Auth-Request-Email");
  lines.push("\trequest_header -X-Auth-Request-Groups");
  lines.push("\trequest_header -X-Auth-Request-Preferred-Username");
  lines.push("");
  lines.push("\t# Local stand-in for SSO forward-auth. A real edge validates the");
  lines.push("\t# session cookie and injects these headers the same way. `map`");
  lines.push("\t# yields empty strings when signed out, which the zones treat as");
  lines.push("\t# anonymous.");
  lines.push("\tmap {http.request.cookie.dev-session} {auth_user} {");
  lines.push('\t\tdefault ""');
  lines.push(`\t\t1 "${DEV_USER.id}"`);
  lines.push("\t}");
  lines.push("\tmap {http.request.cookie.dev-session} {auth_email} {");
  lines.push('\t\tdefault ""');
  lines.push(`\t\t1 "${DEV_USER.email}"`);
  lines.push("\t}");
  lines.push("\tmap {http.request.cookie.dev-session} {auth_groups} {");
  lines.push('\t\tdefault ""');
  lines.push(`\t\t1 "${DEV_USER.groups}"`);
  lines.push("\t}");
  lines.push("\tmap {http.request.cookie.dev-session} {auth_name} {");
  lines.push('\t\tdefault ""');
  lines.push(`\t\t1 "${DEV_USER.name}"`);
  lines.push("\t}");
  lines.push("");

  const routedZones = zones.filter((zone) => zone.path !== "/");

  // Asset routes come first: they are the most specific and never overlap pages.
  for (const zone of routedZones) {
    if (!zone.assets) continue;
    const matcher = `@assets_${zone.id}`;
    lines.push(`\t${matcher} path ${zone.assets}/*`);
    lines.push(`\thandle ${matcher} {`);
    lines.push(...proxyBlock(zone.port));
    lines.push("\t}");
    lines.push("");
  }

  for (const zone of routedZones) {
    const matcher = `@zone_${zone.id}`;
    lines.push(`\t${matcher} path ${zone.path} ${zone.path}/*`);
    lines.push(`\thandle ${matcher} {`);
    if (zone.framework === "vite") {
      // Vite serves its app under a trailing-slash base. Rewrite the bare zone
      // path so /reports works without a redirect while the URL stays canonical.
      lines.push(`\t\t@bare_${zone.id} path ${zone.path}`);
      lines.push(`\t\trewrite @bare_${zone.id} ${zone.path}/`);
    }
    lines.push(...proxyBlock(zone.port));
    lines.push("\t}");
    lines.push("");
  }

  for (const service of services) {
    const matcher = `@service_${service.id.replace(/[^a-z0-9]/gi, "_")}`;
    lines.push(`\t${matcher} path ${service.path} ${service.path}/*`);
    lines.push(`\thandle ${matcher} {`);
    lines.push(...proxyBlock(service.port));
    lines.push("\t}");
    lines.push("");
  }

  lines.push("\t# Everything else belongs to the shell zone.");
  lines.push("\thandle {");
  lines.push(...proxyBlock(shell.port));
  lines.push("\t}");
  lines.push("");

  // A real 503, served by the edge, with no dependency on the shell.
  lines.push("\thandle_errors {");
  lines.push(
    "\t\t@unavailable expression {http.error.status_code} >= 502 && {http.error.status_code} <= 504",
  );
  lines.push("\t\thandle @unavailable {");
  lines.push('\t\t\theader Content-Type "text/html; charset=utf-8"');
  lines.push("\t\t\trespond <<HTML");
  lines.push(indent(renderEdgePage({ originPort }), "\t\t\t"));
  lines.push("\t\t\tHTML 503");
  lines.push("\t\t}");
  lines.push("\t}");
  lines.push("}");

  return `${lines.join("\n")}\n`;
}
