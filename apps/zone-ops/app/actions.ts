"use server";

import { ApiError, OpsSettingsUpdateSchema } from "@micro/api";
import { createServerApi } from "@micro/api/server";
import { headers } from "next/headers";

export type SaveState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function saveSettings(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const raw = {
    routingStrategy: String(formData.get("routingStrategy") ?? ""),
    cutoffTime: String(formData.get("cutoffTime") ?? ""),
    slaThreshold: Number(formData.get("slaThreshold") ?? 0),
    autoReroute: formData.get("autoReroute") === "on",
    escalationEmails: String(formData.get("escalationEmails") ?? "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean),
  };

  const parsed = OpsSettingsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Some fields need attention.", fieldErrors };
  }

  try {
    const api = createServerApi(await headers());
    await api.ops.update(parsed.data);
    return { ok: true, message: "Settings saved. The audit trail has a new entry." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiError
          ? error.message
          : "The settings service could not be reached. Try again.",
    };
  }
}
