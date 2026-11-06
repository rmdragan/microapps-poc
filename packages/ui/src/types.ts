import type { ComponentType, ReactNode } from "react";

export type LinkComponentProps = {
  href: string;
  className?: string;
  children?: ReactNode;
  title?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
  "data-testid"?: string;
  "data-zone"?: string;
  onMouseEnter?: () => void;
  onFocus?: () => void;
};

export type LinkComponent = ComponentType<LinkComponentProps>;

export type BuildInfo = {
  app: string;
  version: string;
  mode: string;
};

export type ZoneInfo = {
  id: string;
  basePath: string;
};
