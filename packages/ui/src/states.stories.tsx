import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { EmptyState, ErrorState, SkeletonCard } from "./states";

const meta = {
  title: "States/Feedback",
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    title: "No services match those filters",
    description: "Try a broader search, or clear the category filter to see the full catalog.",
    action: <Button variant="secondary">Clear filters</Button>,
  },
};

export const Error: Story = {
  args: { title: "" },
  render: () => (
    <div className="w-[640px]">
      <ErrorState
        title="The catalog could not load"
        description="The catalog data service did not answer. The shell and other zones are unaffected."
        action={<Button variant="secondary">Try again</Button>}
      />
    </div>
  ),
};

export const Loading: Story = {
  args: { title: "" },
  render: () => (
    <div className="w-[360px]">
      <SkeletonCard rows={3} />
    </div>
  ),
};
