import { createServerApi } from "@micro/api/server";
import {
  Avatar,
  Card,
  Container,
  PageHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@micro/ui";
import { headers } from "next/headers";
import { requireOpsSession } from "../../lib/require-session";
import { OpsTabs } from "../ops-tabs";

export const metadata = { title: "Audit trail" };

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

export default async function AuditPage() {
  await requireOpsSession();
  const api = createServerApi(await headers());
  const entries = await api.ops.audit();

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Operations zone · Next.js"
        title="Audit trail"
        description="Every policy change, who made it and why. Written by the shared API, rendered by this zone."
      />

      <div className="mt-6">
        <OpsTabs active="audit" />
      </div>

      <Card className="mt-6 overflow-hidden p-2">
        <Table className="table-fixed">
          <THead>
            <TR>
              <TH className="w-[24%] first:pl-5">Actor</TH>
              <TH className="w-[24%]">Change</TH>
              <TH className="hidden w-[38%] md:table-cell">Detail</TH>
              <TH className="w-[14%] whitespace-nowrap last:pr-5 text-right">When</TH>
            </TR>
          </THead>
          <TBody>
            {entries.map((entry) => (
              <TR key={entry.id}>
                <TD className="align-top first:pl-5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={entry.actor} size="sm" />
                    <span className="font-medium text-ink">{entry.actor}</span>
                  </div>
                </TD>
                <TD className="align-top text-ink-soft">{entry.action}</TD>
                <TD className="hidden align-top text-ink-mute md:table-cell">
                  {entry.detail}
                </TD>
                <TD className="whitespace-nowrap align-top last:pr-5 text-right text-xs text-ink-mute">
                  {formatDateTime(entry.at)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </Container>
  );
}
