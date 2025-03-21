import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Profile | lumon",
  description: "Manage your lumon account settings and preferences",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto py-8">{children}</div>;
}
