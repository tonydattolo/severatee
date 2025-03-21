"use client";

import { useLogin } from "@privy-io/react-auth";
import Head from "next/head";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push("/dashboard"),
  });

  return (
    <>
      <Head>
        <title>Login · Privy</title>
      </Head>

      <main className="flex min-h-screen min-w-full">
        <div className="bg-privy-light-blue flex flex-1 items-center justify-center p-6">
          <div>
            <div className="mt-6 flex justify-center text-center">
              <button
                className="rounded-lg bg-violet-600 px-6 py-3 text-white hover:bg-violet-700"
                onClick={login}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
