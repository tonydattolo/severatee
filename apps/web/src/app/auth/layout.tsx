import Link from "next/link";
import { Quantico } from "next/font/google";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const metadata = {
  title: "SeveraTEE - Elevator",
  description: "SeveraTEE - Cold Harbor Vault",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-lumon-terminal-bg text-lumon-terminal-text flex min-h-screen flex-col",
      )}
    >
      <div className="p-4 font-bold">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/img/severatee-0.png"
            alt="SeveraTEE"
            width={100}
            height={100}
          />
        </Link>
      </div>
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="w-full p-4 lg:w-1/2 xl:w-1/3">{children}</div>
      </div>
    </div>
  );
}
