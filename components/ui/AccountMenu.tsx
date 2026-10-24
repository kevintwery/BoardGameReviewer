"use client";

import { UserButton } from "@clerk/nextjs";

// UserButton's compound pieces (UserButton.MenuItems / UserButton.Link) can't
// be referenced from a server component — the RSC bundler can't resolve the
// dotted client references — so the menu lives in its own client component.
export function AccountMenu() {
  return (
    <UserButton afterSignOutUrl="/">
      <UserButton.MenuItems>
        <UserButton.Link label="Account Settings" href="/account" labelIcon={<span aria-hidden>⚙️</span>} />
      </UserButton.MenuItems>
    </UserButton>
  );
}
