"use client";

import * as React from "react";
import {
  IconLayoutDashboard,
  IconUsersGroup,
  IconClock,
  IconSettings,
  IconHelpCircle,
  IconDeviceLaptop,
  IconDatabase
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useProfile } from "@/hooks/use-profile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image"
import Logo from "@/assets/image-dark.png"

const staticData = {
  navMain: [],
  navSecondary: [
    { title: "Settings", url: "/protected/settings", icon: IconSettings },
    { title: "Get Help", url: "/protected/get-help", icon: IconHelpCircle },
  ],
  documents: [
    { name: "Dashboard", url: "/protected", icon: IconLayoutDashboard },
    { name: "Manage Users", url: "/protected/manage-users", icon: IconUsersGroup },
    { name: "Manage Data", url: "/protected/manage-data", icon: IconDatabase },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = useProfile();

  if (!profile) return null;
  console.log("profilessss: ", profile)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="space-y-4 pt-6 pb-2">
        <div className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <a href="/" className="flex items-center gap-3 w-full overflow-hidden group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center">
            <div className="flex bg-[#1c1d22] p-1.5 rounded-lg border border-white/5 shadow-sm justify-center items-center shrink-0">
              <Image
                src={Logo}
                alt="DTI Logo"
                width={20}
                height={20}
                className="block object-contain"
              />
            </div>
            <span className="font-semibold text-sm truncate group-data-[collapsible=icon]:hidden">
              DTI QR Scanner
            </span>
          </a>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={staticData.navMain} />
        <NavDocuments items={staticData.documents} />
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            id: profile?.id ?? "",
            email: profile?.email || "",
            avatar: profile?.avatar_url || "",
            account_type: profile?.account_type || "User",
            firstName: profile?.firstname,
            lastName: profile?.lastname,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}