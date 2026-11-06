"use client";

import { matchZone, toLocalHref, zoneById } from "@micro/routing";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import type { LinkComponentProps } from "./types";
import { useZone } from "./zone-context";

const prefetched = new Set<string>();

function prefetch(href: string) {
  if (typeof document === "undefined" || prefetched.has(href)) return;
  prefetched.add(href);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Next-aware link. Same-zone destinations use the client router; anything that
 * belongs to another zone becomes a real anchor so the browser performs the
 * document navigation Multi-Zones requires. Cross-zone anchors are prefetched on
 * hover and focus to hide the cost.
 */
export function ZoneLink({ href, ...props }: LinkComponentProps) {
  const zone = useZone();
  const target = matchZone(href);

  if (target.id !== zone.id) {
    return (
      <a
        href={href}
        onMouseEnter={() => prefetch(href)}
        onFocus={() => prefetch(href)}
        {...props}
      />
    );
  }

  return <Link href={toLocalHref(href, zoneById(zone.id))} {...props} />;
}

/**
 * next/image requires the basePath inside `src`, which is easy to forget in a
 * zone. This wrapper applies it automatically.
 */
export function ZoneImage({ src, ...props }: ImageProps) {
  const zone = useZone();
  const value = String(src);
  const resolved =
    value.startsWith("/") && zone.basePath && !value.startsWith(`${zone.basePath}/`)
      ? `${zone.basePath}${value}`
      : value;

  return <Image src={resolved} {...props} />;
}
