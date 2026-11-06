import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditional classes plus conflict resolution. Without the merge, a caller's
 * `bg-ink` would race the component's `bg-surface` in the generated CSS.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
