import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: { children: "Save changes" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "accent", "secondary", "ghost", "danger"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Accent: Story = { args: { variant: "accent" } };

export const Secondary: Story = { args: { variant: "secondary" } };

export const Ghost: Story = { args: { variant: "ghost" } };

export const Danger: Story = { args: { variant: "danger" } };

export const WithIcon: Story = {
  args: {
    variant: "accent",
    children: (
      <>
        Continue
        <ArrowRight aria-hidden className="size-4" />
      </>
    ),
  },
};

export const AsLink: Story = {
  args: {
    asChild: true,
    variant: "secondary",
    children: <a href="#example">Open the catalog</a>,
  },
};
