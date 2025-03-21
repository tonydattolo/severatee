"use client";

import Link from "next/link";
import { login } from "@/app/auth/_actions/email-auth-actions";

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

import { useEffect } from "react";
import { toast } from "sonner";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const initialState = {
    message: null,
    error: null,
    email: "",
    password: "",
  };

  const [formState, formAction, isPending] = useActionState(
    login,
    initialState,
  );

  useEffect(() => {
    if (formState?.error) {
      toast.error(formState.error);
    }
    if (formState?.message) {
      toast.success(formState.message);
      router.push("/lumon/dashboard");
      // router.refresh();
    }
  }, [formState, toast, router]);

  const handleSubmit = async (formData: FormData) => {
    return formAction(formData);
  };

  return (
    <>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  autoComplete="email"
                  defaultValue={formState?.email || ""}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  defaultValue={formState?.password || ""}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Logging in..." : "Login"}
              </Button>
              <Divider text="OR" />
              <GoogleSignInButton disabled={true} />
              <Divider text="OR" />
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
