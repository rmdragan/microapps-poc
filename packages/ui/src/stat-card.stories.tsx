import type { Meta, StoryObj } from "@storybook/react-vite";
import { Gauge, Package, TriangleAlert } from "lucide-react";
import { StatCard } from "./stat-card";

const meta = {
  title: "Data/StatCard",
  component: StatCard,
  args: {
    label: "On-time",
    value: "97.4",
    suffix: "%",
    delta: "+0.8 pts",
    deltaTone: "positive",
    hint: "14 days",
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { icon: <Gauge aria-hidden className="size-4" /> },
};

export const Negative: Story = {
  args: {
    label: "Incidents",
    value: "12",
    suffix: undefined,
    delta: "+3",
    deltaTone: "negative",
    hint: "open",
    icon: <TriangleAlert aria-hidden className="size-4" />,
  },
};

export const NoDelta: Story = {
  args: {
    label: "Services",
    value: "12",
    suffix: undefined,
    delta: undefined,
    hint: "in catalog",
    icon: <Package aria-hidden className="size-4" />,
  },
};
