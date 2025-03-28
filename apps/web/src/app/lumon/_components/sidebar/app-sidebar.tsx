"use client";

import * as React from "react";
import {
  BarChart3,
  Briefcase,
  ChevronRight,
  Cog,
  FileText,
  HelpCircle,
  Layout,
  LucideIcon,
  MessageCircle,
  Map,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Scroll,
  Mail,
  MessageSquareText,
  Droplet,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Progress } from "@/components/ui/progress";

import { NavUser } from "./nav-user";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarThemeToggle } from "./sidebar-theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useRBAC } from "@/app/contexts/rbac-context";
import Link from "next/link";

const navigation = [
  {
    title: "Dashboard",
    icon: Layout,
    url: "/lumon/dashboard",
  },
  {
    title: "Kier",
    icon: MessageSquareText,
    url: "/lumon/kier",
  },
  {
    title: "Macrodata Refinement",
    icon: Droplet,
    items: [
      { title: "Tasks", url: "/lumon/mdr/tasks" },
      { title: "Refiner-Agents", url: "/lumon/mdr/agents" },
      { title: "Submit", url: "/lumon/mdr/tasks/submit" },
    ],
  },
];

interface NavItem {
  title: string;
  icon: LucideIcon;
  url?: string;
  items?: { title: string; url: string }[];
}

interface RefinementRoom {
  name: string;
  progress: number;
  isComplete: boolean;
}

const refinementRooms: RefinementRoom[] = [
  { name: "Cold Harbor", progress: 96, isComplete: false },
  { name: "Cairns", progress: 100, isComplete: true },
  { name: "Wellington", progress: 100, isComplete: true },
  { name: "Billings", progress: 100, isComplete: true },
  { name: "Zurich", progress: 100, isComplete: true },
  { name: "Lucknow", progress: 100, isComplete: true },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | undefined;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { profile, currentWorkspace } = useRBAC();
  const userData = {
    name: profile?.name ?? "Name not set",
    email: user?.email ?? null,
    avatar: profile?.avatarUrl ?? null,
  };

  const renderMenuItem = (item: NavItem) => {
    if (item.url) {
      // Render a flat menu link for items without subitems
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild tooltip={item.title}>
            <Link href={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    } else {
      // Render a collapsible menu for items with subitems
      return (
        <Collapsible
          key={item.title}
          asChild
          className="group/collapsible"
          defaultOpen
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild>
                      <a href={subItem.url}>
                        <span>{subItem.title}</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarTrigger />
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map((item) => renderMenuItem(item))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Refinement Rooms</SidebarGroupLabel>
          <SidebarGroupContent>
            {refinementRooms.map((room) => (
              <div key={room.name} className="px-3 py-1">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={room.isComplete ? "text-muted-foreground" : ""}
                  >
                    {room.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {room.progress}%
                  </span>
                </div>
                <Progress
                  value={room.progress}
                  className={`mt-1 h-1 ${room.isComplete ? "bg-muted" : ""}`}
                />
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator className="my-2" />
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip="Workspace Settings"
            className="border border-dashed border-red-700 text-red-700 hover:border-red-500 hover:text-red-500"
          >
            <Link href="/lumon/superadmin">
              <ShieldAlert />
              <span>Super Admin</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Workspace Settings">
            <Link href="/lumon/workspace/settings">
              <Settings />
              <span>Workspace Settings</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
