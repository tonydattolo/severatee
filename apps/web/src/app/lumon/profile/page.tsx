"use client";

import { useState } from "react";
import PersonalInfoForm from "./_components/personal-info-form";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRBAC } from "@/app/contexts/rbac-context";

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("personal-info");
  const { profile } = useRBAC();

  const sections = [
    {
      id: "personal-info",
      label: "Personal Information",
      component: () => <PersonalInfoForm />,
    },
  ];

  if (!profile) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto py-2">
      <h3 className="text-2xl font-bold">Profile Settings</h3>
      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <aside className="w-full space-y-2 md:w-64">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {sections.map((section) => (
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
          {sections.map(
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
