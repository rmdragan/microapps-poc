import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./app-shell";
import { Providers } from "./providers";

const meta = {
  title: "Chrome/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const user = {
  id: "robin.vale",
  name: "Robin Vale",
  email: "robin.vale@example.com",
  groups: ["platform", "ops"],
};

export const SignedIn: Story = {
  args: {
    zone: { id: "catalog" },
    build: { app: "zone-catalog", version: "abc1234+202611061600", mode: "production" },
    children: (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          Catalog zone
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Service catalog</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-7 text-ink-soft">
          This is the shared chrome. Every zone renders it from <code>@micro/ui</code>, so the
          header, navigation and footer look identical across Next.js and Vite.
        </p>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <Providers user={user} zone={{ id: "catalog", basePath: "/catalog" }}>
        <Story />
      </Providers>
    ),
  ],
};

export const SignedOut: Story = {
  ...SignedIn,
  decorators: [
    (Story) => (
      <Providers user={null} zone={{ id: "shell", basePath: "" }}>
        <Story />
      </Providers>
    ),
  ],
};
