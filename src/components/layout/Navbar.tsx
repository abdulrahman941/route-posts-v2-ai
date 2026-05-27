"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, User, Bell, LogOut, Rss } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const links = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/users", icon: Rss, label: "People" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/feed" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white text-sm font-black">R</div>
          Route Posts
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`btn-ghost text-xs flex-col gap-0.5 px-2 py-1.5 h-auto ${pathname.startsWith(href) ? "text-blue-600 bg-blue-50" : ""}`}
            >
              <Icon size={18} />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}

          {session?.user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100">
              <Link href="/profile">
                <Avatar name={session.user.name} image={session.user.image} size="sm" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="btn-ghost text-gray-400 hover:text-red-500 p-2"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
