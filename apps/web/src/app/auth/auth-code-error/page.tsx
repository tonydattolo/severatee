"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Unknown error";

  return (
    <div className="container mx-auto flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                There was a problem with the authentication process:
              </p>
              <p className="mt-2 font-mono text-xs text-red-800">{error}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">This could be due to:</p>
              <ul className="list-inside list-disc text-sm text-gray-600">
                <li>An expired or invalid authentication session</li>
                <li>Incorrect OAuth configuration</li>
                <li>Browser cookie or storage issues</li>
                <li>Network connectivity problems</li>
              </ul>
            </div>

            <div className="flex justify-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/auth/login">Return to Login</Link>
              </Button>
              <Button asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
