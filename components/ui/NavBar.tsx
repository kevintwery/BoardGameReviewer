import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function NavBar() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold">
          Board Game Review
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/games" className="hover:underline">
            Browse
          </Link>
          <Link href="/planner" className="hover:underline">
            Game Night Planner
          </Link>
          <SignedIn>
            <Link href="/lists" className="hover:underline">
              My Lists
            </Link>
          </SignedIn>

          <ThemeToggle />

          <SignedIn>
            <UserButton afterSignOutUrl="/">
              <UserButton.MenuItems>
                <UserButton.Link label="Account Settings" href="/account" labelIcon={<span aria-hidden>⚙️</span>} />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <button className="rounded-md bg-brand-500 px-3 py-1.5 font-medium text-white hover:bg-brand-600">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}
