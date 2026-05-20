"use client";

import * as React from "react";
import {
  LayoutDashboard,
  ChartColumn,
  House,
  LogIn,
  UserPlus,
  KeyRound,
  Settings,
  CreditCard,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { useIntlayer } from "react-intlayer";
import { type To } from "@/components/localized-link";

import { authClient } from "@/lib/auth-client";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";

const iconMap: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/admin/analytics": ChartColumn,
  "/": House,
  "/sign-in": LogIn,
  "/sign-up": UserPlus,
  "/forgot-password": KeyRound,
  "/settings/account": Settings,
  "/settings/organization": Building2,
  "/settings/billing": CreditCard,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = authClient.useSession();
  const content = useIntlayer("app-sidebar");

  type NavItem = {
    title: { value: string };
    url: { value: string };
  };

  type NavGroup = {
    label: { value: string };
    items: NavItem[];
  };

  const navGroups = ((content.groups as unknown as NavGroup[]) || []).map((group: NavGroup) => ({
    label: group.label.value,
    items: group.items.map((item: NavItem) => ({
      title: item.title.value,
      url: item.url.value as To,
      icon: iconMap[item.url.value],
    })),
  }));

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map(
          (group: { label: string; items: { title: string; url: To; icon: LucideIcon }[] }) => (
            <NavMain key={group.label} label={group.label} items={group.items} />
          ),
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: session.data?.user?.name ?? "ConvexZen",
            email:
              session.data?.user?.email ??
              ((content.signedIn as unknown as { value: string })?.value || "Signed in"),
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
