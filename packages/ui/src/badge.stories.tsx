import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Dot } from "./surface";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  args: { children: "Live" },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "accent", "success", "warning", "danger", "info"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Success: Story = { args: { tone: "success" } };

export const Warning: Story = { args: { tone: "warning" } };

export const Danger: Story = { args: { tone: "danger" } };

export const WithDot: Story = {
  args: {
    tone: "success",
    children: (
      <>
        <Dot tone="success" />
        operational
      </>
    ),
  },
};
