"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Divider from "@/components/common/divider";
import GoogleSignInButton from "@/app/auth/_components/signin-with-google-button";
import { signup } from "@/app/auth/_actions/email-auth-actions";
import { useEffect, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignupForm() {
  const [signupsClosed, setSignupsClosed] = useState(true);
  const router = useRouter();

  const initialState = {
    message: "",
    error: "",
  };
  const [formState, formAction, isPending] = useActionState(
    signup,
    initialState,
  );

  useEffect(() => {
    if (formState?.error) {
      toast.error(formState.error);
    }
    if (formState?.message) {
      toast.success(formState.message);
      router.push("/auth/login");
    }
  }, [formState]);
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <div className="grid gap-4">
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" placeholder="Aswath" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" placeholder="Damodaran" required />
              </div>
            </div> */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
                disabled={signupsClosed}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={signupsClosed}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                toast.info("Private Beta, email devs to signup");
              }}
              disabled={isPending}
            >
              {isPending ? "Signing up..." : "Private Closed Beta"}
            </Button>
            <Divider text="OR" />
            <GoogleSignInButton disabled />
            <Divider text="OR" />
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline">
              Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
