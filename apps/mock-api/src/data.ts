import type { AuditEntry, CatalogItem, Courier, OpsSettings, TimeseriesPoint } from "@micro/api";

export const catalogItems: CatalogItem[] = [
  {
    id: "same-day",
    name: "Same-day parcel",
    tagline: "Metro-to-metro delivery before midnight.",
    description:
      "Pickup before 11:00, delivered the same evening inside the metro network. Built for spare parts, documents and customer replacements where a day makes a difference.",
    category: "Parcel",
    regions: ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven"],
    slaHours: 10,
    priceFrom: 8.4,
    priceUnit: "parcel",
    status: "ga",
    updatedAt: "2026-10-28T09:20:00.000Z",
    highlights: ["Live courier tracking", "Photo proof of delivery", "11:00 local cutoff"],
    metrics: { onTime: 98.2, volume: 12840, incidents: 4 },
  },
  {
    id: "next-day",
    name: "Next-day parcel",
    tagline: "Nationwide coverage with a predictable morning window.",
    description:
      "The default service for e-commerce and B2B parcels. Collected today, delivered tomorrow before 18:00 anywhere in the national network.",
    category: "Parcel",
    regions: ["Netherlands", "Belgium", "Germany (west)"],
    slaHours: 30,
    priceFrom: 4.9,
    priceUnit: "parcel",
    status: "ga",
    updatedAt: "2026-10-21T14:05:00.000Z",
    highlights: ["98.6% first-attempt success", "Address validation API", "Returns-ready labels"],
    metrics: { onTime: 98.6, volume: 74210, incidents: 21 },
  },
  {
    id: "cold-chain",
    name: "Cold chain 2–8°C",
    tagline: "Validated temperature control from pickup to signature.",
    description:
      "Insulated totes with continuous temperature logging for pharmaceuticals, diagnostics and fresh food. Excursions are flagged before the parcel leaves the hub.",
    category: "Cold chain",
    regions: ["Netherlands", "Belgium"],
    slaHours: 18,
    priceFrom: 24.5,
    priceUnit: "parcel",
    status: "ga",
    updatedAt: "2026-11-02T08:40:00.000Z",
    highlights: ["Audit-ready temperature log", "Validated packaging", "Excursion alerts"],
    metrics: { onTime: 99.4, volume: 3120, incidents: 1 },
  },
  {
    id: "hyperlocal",
    name: "Hyperlocal 90-minute",
    tagline: "Courier dispatch from the nearest micro-hub.",
    description:
      "On-demand pickup and delivery within 90 minutes in dense urban areas. Stock is reserved from a micro-hub, so the promise survives rush hour.",
    category: "On-demand",
    regions: ["Amsterdam", "Rotterdam", "Utrecht"],
    slaHours: 1.5,
    priceFrom: 11.2,
    priceUnit: "parcel",
    status: "ga",
    updatedAt: "2026-10-30T11:15:00.000Z",
    highlights: ["90-minute promise", "Micro-hub inventory sync", "Courier ETA streaming"],
    metrics: { onTime: 95.1, volume: 9860, incidents: 32 },
  },
  {
    id: "returns",
    name: "Returns and reverse logistics",
    tagline: "A prepaid label, a drop-off network and a clean audit trail.",
    description:
      "Customer-initiated returns with QR drop-off, home pickup and consolidated backhaul to the merchant. In beta with three retail partners.",
    category: "Parcel",
    regions: ["Netherlands", "Belgium"],
    slaHours: 72,
    priceFrom: 5.6,
    priceUnit: "parcel",
    status: "beta",
    updatedAt: "2026-11-05T10:00:00.000Z",
    highlights: ["QR drop-off", "Consolidated backhaul", "Merchant webhook events"],
    metrics: { onTime: 96.8, volume: 4210, incidents: 12 },
  },
  {
    id: "ltl-freight",
    name: "LTL freight",
    tagline: "Less-than-truckload pallets on scheduled linehauls.",
    description:
      "Share a trailer without waiting for a full load. Pallets are consolidated at the hub and moved on nightly linehauls with tail-lift delivery.",
    category: "Freight",
    regions: ["Benelux", "Germany (west)", "France (north)"],
    slaHours: 48,
    priceFrom: 89,
    priceUnit: "pallet",
    status: "ga",
    updatedAt: "2026-10-18T09:30:00.000Z",
    highlights: ["Tail-lift included", "Pallet tracking", "Nightly linehaul"],
    metrics: { onTime: 94.7, volume: 2870, incidents: 9 },
  },
  {
    id: "pallet-network",
    name: "Pallet network",
    tagline: "Full and partial pallets with dock-to-dock SLAs.",
    description:
      "For suppliers shipping weekly pallet volumes. Booked capacity, dock scheduling and a two-day dock-to-dock SLA across the core network.",
    category: "Freight",
    regions: ["Benelux", "Germany", "France"],
    slaHours: 48,
    priceFrom: 132,
    priceUnit: "pallet",
    status: "ga",
    updatedAt: "2026-09-29T16:45:00.000Z",
    highlights: ["Booked capacity", "Dock scheduling", "Damage-free guarantee"],
    metrics: { onTime: 96.1, volume: 1840, incidents: 5 },
  },
  {
    id: "medical-priority",
    name: "Medical priority",
    tagline: "Dedicated courier for time-critical specimens.",
    description:
      "A single courier, a sealed chain of custody and a two-hour delivery window for hospitals and labs. Escalation is staffed 24/7.",
    category: "On-demand",
    regions: ["Randstad", "Brabant"],
    slaHours: 2,
    priceFrom: 46,
    priceUnit: "parcel",
    status: "ga",
    updatedAt: "2026-11-01T07:10:00.000Z",
    highlights: ["Chain of custody", "24/7 escalation", "Dedicated courier"],
    metrics: { onTime: 99.7, volume: 640, incidents: 2 },
  },
  {
    id: "scheduled-windows",
    name: "Scheduled windows",
    tagline: "Two-hour delivery windows customers can actually plan around.",
    description:
      "Let customers pick a two-hour window at checkout. Capacity is reserved per postcode and the courier route is planned around the promise.",
    category: "Parcel",
    regions: ["Netherlands"],
    slaHours: 24,
    priceFrom: 7.1,
    priceUnit: "parcel",
    status: "ga",
    updatedAt: "2026-10-25T12:00:00.000Z",
    highlights: ["Two-hour windows", "Postcode capacity", "Reschedule in transit"],
    metrics: { onTime: 97.9, volume: 15620, incidents: 14 },
  },
  {
    id: "cross-border",
    name: "Cross-border parcel",
    tagline: "Customs-cleared delivery into Germany and France.",
    description:
      "DDP and DAP options with pre-cleared customs data. The first scan is a customs acceptance, so exceptions surface before the parcel reaches the border.",
    category: "Parcel",
    regions: ["Germany", "France", "Belgium"],
    slaHours: 72,
    priceFrom: 12.4,
    priceUnit: "parcel",
    status: "ga",
    updatedAt: "2026-10-12T13:25:00.000Z",
    highlights: ["DDP / DAP", "Pre-cleared customs", "Border exception alerts"],
    metrics: { onTime: 93.4, volume: 8970, incidents: 41 },
  },
  {
    id: "drone-pilot",
    name: "Drone pilot",
    tagline: "Autonomous last-mile flights in a controlled corridor.",
    description:
      "A regulated pilot flying medical samples between two hospital campuses. Two flights per hour, weather-gated and monitored from the operations room.",
    category: "On-demand",
    regions: ["Rotterdam corridor"],
    slaHours: 0.5,
    priceFrom: 0,
    priceUnit: "parcel",
    status: "beta",
    updatedAt: "2026-11-06T06:30:00.000Z",
    highlights: ["Regulated corridor", "Weather gating", "Two flights per hour"],
    metrics: { onTime: 92.3, volume: 180, incidents: 3 },
  },
  {
    id: "weekend-crew",
    name: "Weekend crew",
    tagline: "Saturday and Sunday delivery for scheduled parcels.",
    description:
      "A dedicated weekend crew for scheduled and next-day parcels. Paused while the new roster is negotiated with the works council.",
    category: "Parcel",
    regions: ["Netherlands"],
    slaHours: 36,
    priceFrom: 9.8,
    priceUnit: "parcel",
    status: "paused",
    updatedAt: "2026-10-08T08:00:00.000Z",
    highlights: ["Saturday and Sunday", "Scheduled only", "Roster in negotiation"],
    metrics: { onTime: 95.5, volume: 0, incidents: 0 },
  },
];

const initialOpsSettings: OpsSettings = {
  routingStrategy: "balanced",
  cutoffTime: "17:30",
  slaThreshold: 96,
  autoReroute: true,
  escalationEmails: ["ops-lead@relay.example", "dispatch@relay.example"],
  updatedAt: "2026-11-04T16:12:00.000Z",
  updatedBy: "Mira Sol",
};

export let opsSettings: OpsSettings = {
  ...initialOpsSettings,
  escalationEmails: [...initialOpsSettings.escalationEmails],
};

export function setOpsSettings(next: OpsSettings) {
  opsSettings = next;
}

const initialAuditLog: AuditEntry[] = [
  {
    id: "a-1042",
    at: "2026-11-04T16:12:00.000Z",
    actor: "Mira Sol",
    action: "Updated SLA threshold",
    detail: "Raised the on-time target from 95% to 96% for the winter peak.",
  },
  {
    id: "a-1041",
    at: "2026-11-03T09:41:00.000Z",
    actor: "Robin Vale",
    action: "Enabled auto-reroute",
    detail: "Couriers now re-route automatically when a hub reports a delay over 20 minutes.",
  },
  {
    id: "a-1040",
    at: "2026-11-01T18:03:00.000Z",
    actor: "Mira Sol",
    action: "Added escalation contact",
    detail: "dispatch@relay.example added to the on-call rotation.",
  },
  {
    id: "a-1039",
    at: "2026-10-30T11:22:00.000Z",
    actor: "Jonas Bakker",
    action: "Changed routing strategy",
    detail: "Switched from cheapest to balanced ahead of the Black Friday forecast.",
  },
  {
    id: "a-1038",
    at: "2026-10-27T15:55:00.000Z",
    actor: "Robin Vale",
    action: "Updated cutoff time",
    detail: "Moved the same-day cutoff from 10:30 to 11:00 after the hub trial.",
  },
];

export const auditLog: AuditEntry[] = initialAuditLog.map((entry) => ({ ...entry }));

/** Used by the demo control endpoint and by the E2E suite. */
export function resetData(): void {
  opsSettings = {
    ...initialOpsSettings,
    escalationEmails: [...initialOpsSettings.escalationEmails],
  };
  auditLog.splice(0, auditLog.length, ...initialAuditLog.map((entry) => ({ ...entry })));
}

export const couriers: Courier[] = [
  { id: "c-01", name: "Amara Okafor", hub: "Amsterdam West", deliveries: 186, onTime: 99.1, status: "active" },
  { id: "c-02", name: "Joost de Vries", hub: "Rotterdam South", deliveries: 174, onTime: 97.8, status: "active" },
  { id: "c-03", name: "Lina Haddad", hub: "Utrecht Central", deliveries: 168, onTime: 98.4, status: "active" },
  { id: "c-04", name: "Bram Willems", hub: "Eindhoven North", deliveries: 151, onTime: 95.2, status: "break" },
  { id: "c-05", name: "Sofia Mendes", hub: "Amsterdam East", deliveries: 149, onTime: 98.9, status: "active" },
  { id: "c-06", name: "Noah Fischer", hub: "The Hague", deliveries: 142, onTime: 96.4, status: "active" },
  { id: "c-07", name: "Priya Raman", hub: "Rotterdam North", deliveries: 137, onTime: 97.1, status: "offline" },
  { id: "c-08", name: "Tomas Nowak", hub: "Utrecht West", deliveries: 128, onTime: 94.8, status: "active" },
];

export const timeseries: TimeseriesPoint[] = Array.from({ length: 14 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 9, 24 + index));
  const weekend = [0, 6].includes(date.getUTCDay()) ? -320 : 0;
  const wave = Math.sin(index / 2.1) * 130;
  return {
    day: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }),
    volume: Math.round(1560 + wave + weekend + (index % 3) * 45),
    onTime: Number((96.4 + Math.sin(index / 2.7) * 1.1).toFixed(1)),
  };
});

export const reportSummary = {
  window: "Last 14 days",
  onTime: 97.4,
  volume: 24816,
  incidents: 12,
  costPerParcel: 2.14,
  deltas: {
    onTime: 0.8,
    volume: 6.2,
    incidents: -3,
    costPerParcel: -0.06,
  },
};
