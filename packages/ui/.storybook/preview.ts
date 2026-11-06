import type { Preview } from "@storybook/react-vite";
import "./preview.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    backgrounds: {
      default: "canvas",
      values: [{ name: "canvas", value: "#f6f4f0" }],
    },
  },
};

export default preview;
