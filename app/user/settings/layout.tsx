"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsHeader } from "./SettingHeader";

const navItems = [
  { label: "General", href: "/user/settings/general" },
  { label: "Password", href: "/user/settings/password" },
  { label: "API Key", href: "/user/settings/api-key" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = navItems.find((i) => pathname.startsWith(i.href))?.href ?? navItems[0].href;

  return (
    <div className="flex h-full w-full max-w-4xl mx-auto">
      <SettingsHeader />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0  h-full pt-8 px-3 gap-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground "
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-y-auto">
        {/* Mobile tabs */}
        <div className="md:hidden  px-4 pt-4">
          <Tabs value={activeTab} onValueChange={(v) => router.push(v)}>
            <TabsList className="w-full">
              {navItems.map((item) => (
                <TabsTrigger key={item.href} value={item.href} className="flex-1">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="px-8 py-8 max-w-2xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
