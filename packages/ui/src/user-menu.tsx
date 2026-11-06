"use client";

import { useSession } from "@micro/auth";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { Skeleton } from "./states";
import { cn } from "./utils";

function loginHref(returnTo: string): string {
  return `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

const subscribe = () => () => {};

const itemClass =
  "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink-soft outline-none transition-colors focus:bg-canvas focus:text-ink";

export function UserMenu() {
  const { user } = useSession();
  // No setState-in-effect: read the browser location through an external store.
  const path = useSyncExternalStore(
    subscribe,
    () => window.location.pathname + window.location.search,
    () => "/",
  );

  if (user === undefined) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (user === null) {
    return (
      <Button asChild variant="secondary" size="sm">
        <a href={loginHref(path)}>Sign in</a>
      </Button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-full border border-line bg-surface p-0.5 pr-2.5 text-left transition-colors hover:border-line-strong"
          aria-label={`Account menu for ${user.name}`}
        >
          <Avatar name={user.name} />
          <span className="hidden text-[13px] font-medium text-ink sm:block">{user.name}</span>
          <ChevronDown
            aria-hidden
            className="size-3.5 text-ink-mute transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-60 rounded-xl border border-line bg-surface p-1.5 shadow-pop"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-mute">{user.email}</p>
            {user.groups.length ? (
              <p className="mt-2 text-[11px] uppercase tracking-wide text-ink-mute">
                {user.groups.join(" · ")}
              </p>
            ) : null}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild>
            <a href="/auth/logout" className={cn(itemClass, "text-danger focus:text-danger")}>
              <LogOut aria-hidden className="size-4" />
              Sign out
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
