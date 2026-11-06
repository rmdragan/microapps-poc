import { mkdirSync, writeFileSync } from "node:fs";
import { renderIngress } from "./ingress.ts";

const output = new URL("../deploy/ingress.yaml", import.meta.url);
mkdirSync(new URL("../deploy/", import.meta.url), { recursive: true });
writeFileSync(output, renderIngress());
console.log("Wrote deploy/ingress.yaml");
