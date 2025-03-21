"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRBAC } from "@/app/contexts/rbac-context";
import MembersTable from "./_components/members-table";
import GeneralSettings from "./_components/general-settings";
import InvitationsTable from "./_components/invitations-table";

export default function WorkspaceSettingsPage() {
  const [activeSection, setActiveSection] = useState("members");
  const { currentWorkspace, permissions } = useRBAC();

  const sections = [
    {
      id: "members",
      label: "Members",
      component: () => <MembersTable />,
      permission: "MANAGE_MEMBERS" as const,
    },
    {
      id: "invitations",
      label: "Invitations",
      component: () => <InvitationsTable />,
      permission: "INVITE_MEMBERS" as const,
    },
    {
      id: "general",
      label: "General Settings",
      component: () => <GeneralSettings />,
      permission: "EDIT_WORKSPACE" as const,
    },
    // Add more sections as needed
    // {
    //   id: "billing",
    //   label: "Billing & Subscription",
    //   component: () => <BillingSettings />,
    //   permission: "MANAGE_BILLING" as const,
    // },
  ];

  if (!currentWorkspace) {
    return <div>Please select a workspace to view settings.</div>;
  }

  const authorizedSections = sections.filter((section) =>
    permissions.includes(section.permission),
  );

  return (
    <div className="container mx-auto py-2">
      <h3 className="text-2xl font-bold">Workspace Settings</h3>
      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <aside className="w-full space-y-2 md:w-64">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {authorizedSections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
          </ScrollArea>
        </aside>
        <main className="flex-1">
          {authorizedSections.map(
            (section) =>
              activeSection === section.id && (
                <section.component key={section.id} />
              ),
          )}
        </main>
      </div>
    </div>
  );
}
