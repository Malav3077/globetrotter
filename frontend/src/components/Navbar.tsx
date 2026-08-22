"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "My Trips" },
  { href: "/explore", label: "Explore" },
  { href: "/community", label: "Community" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-ink-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">G</span>
          GlobeTrotter
        </Link>

        <div className="flex flex-1 items-center gap-1">
          {[...LINKS, ...(user.is_admin ? [{ href: "/admin", label: "Admin" }] : [])].map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <Link href="/profile" className="text-sm font-medium text-ink-700 hover:text-brand-700">
          {user.first_name}
        </Link>
        <button onClick={logout} className="text-sm text-ink-500 hover:text-danger-600 cursor-pointer">
          Log out
        </button>
      </nav>
    </header>
  );
}
