import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, HydrateClient } from "@/trpc/server";
import { ArrowRight, Database, Lock, Shield, Wallet, Zap } from "lucide-react";
import { ProcessTabs } from "@/components/process-tabs";

export default async function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-lumon-blue absolute inset-0 z-0"></div>
        <div className="relative z-10 container mx-auto px-4">
          <Image
            src="/img/lumon-1.png"
            alt="Lumon Industries"
            width={701}
            height={254}
            className="mx-auto mb-8"
            priority
          />
          <div className="mx-auto mb-8 text-4xl font-bold text-white">
            LUMON
          </div>
          <h1 className="mb-4 text-4xl font-light tracking-tight text-white">
            SeveraTEE - Cold Harbor Vault
          </h1>
          <p className="text-lumon-light-blue mx-auto mb-8 max-w-2xl text-xl font-light">
            Secure data refinement through our proprietary severance procedure.
            <br />
            <span className="font-medium text-white">
              Please enjoy all numbers equally.
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-lumon-light-blue hover:bg-lumon-light-blue/90 text-lumon-blue rounded-sm px-6">
              Begin Refinement <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-lumon-light-blue text-lumon-blue hover:bg-lumon-light-blue/80 rounded-sm px-6"
            >
              Learn About Severance
            </Button>
          </div>
        </div>
      </section>

      {/* Project Explanation Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-lumon-blue mb-8 text-center text-3xl font-light">
            How Cold Harbor Vault Works
          </h2>
          <div className="mx-auto max-w-4xl">
            <p className="mb-6 text-lg text-slate-700">
              Cold Harbor Vault is inspired by the Severance universe, where
              "innies" perform secure data refinement tasks inside Trusted
              Execution Environments (TEEs), while "outties" (managers) receive
              only aggregated insights without visibility into the inner
              computations.
            </p>

            <div className="mb-8 grid gap-6 md:grid-cols-2">
              <Card className="border-lumon-light-blue bg-lumon-light-blue/20 border p-6">
                <h3 className="text-lumon-blue mb-3 text-xl font-medium">
                  For Innies
                </h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <div className="bg-lumon-blue mt-1 mr-2 h-4 w-4 rounded-full"></div>
                    <span>Assigned a unique, privacy-preserving wallet</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lumon-blue mt-1 mr-2 h-4 w-4 rounded-full"></div>
                    <span>
                      Perform data refinement tasks in a secure environment
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lumon-blue mt-1 mr-2 h-4 w-4 rounded-full"></div>
                    <span>Receive automated payments based on performance</span>
                  </li>
                </ul>
              </Card>

              <Card className="border-lumon-light-blue bg-lumon-light-blue/20 border p-6">
                <h3 className="text-lumon-blue mb-3 text-xl font-medium">
                  For Outties
                </h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <div className="bg-lumon-blue mt-1 mr-2 h-4 w-4 rounded-full"></div>
                    <span>View only aggregated metrics and insights</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lumon-blue mt-1 mr-2 h-4 w-4 rounded-full"></div>
                    <span>No visibility into granular inner computations</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lumon-blue mt-1 mr-2 h-4 w-4 rounded-full"></div>
                    <span>Automated payment system with full audit trail</span>
                  </li>
                </ul>
              </Card>
            </div>

            <p className="text-lg text-slate-700">
              The system leverages blockchain technology, zero-knowledge proofs,
              and trusted execution environments to create a secure, private,
              and efficient data refinement process that protects sensitive
              information while ensuring computational integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Process Stepper Section */}
      <section className="bg-lumon-blue py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-lumon-light-blue mb-12 text-center text-3xl font-light">
            The Cold Harbor Process
          </h2>

          {/* Horizontal Stepper */}
          <div className="mb-12">
            <div className="relative mx-auto max-w-4xl">
              {/* Connecting Line */}
              <div className="bg-lumon-light-blue/50 absolute top-1/2 left-0 h-1 w-full -translate-y-1/2"></div>

              {/* Step Circles */}
              <div className="relative flex justify-between">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="bg-lumon-light-blue text-lumon-blue z-10 flex h-10 w-10 items-center justify-center rounded-full">
                    1
                  </div>
                  <span className="text-lumon-light-blue mt-2 text-sm font-medium">
                    Onboarding
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className="bg-lumon-light-blue text-lumon-blue z-10 flex h-10 w-10 items-center justify-center rounded-full">
                    2
                  </div>
                  <span className="text-lumon-light-blue mt-2 text-sm font-medium">
                    Task Assignment
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className="bg-lumon-light-blue text-lumon-blue z-10 flex h-10 w-10 items-center justify-center rounded-full">
                    3
                  </div>
                  <span className="text-lumon-light-blue mt-2 text-sm font-medium">
                    Computation
                  </span>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center">
                  <div className="bg-lumon-light-blue text-lumon-blue z-10 flex h-10 w-10 items-center justify-center rounded-full">
                    4
                  </div>
                  <span className="text-lumon-light-blue mt-2 text-sm font-medium">
                    Verification
                  </span>
                </div>

                {/* Step 5 */}
                <div className="flex flex-col items-center">
                  <div className="bg-lumon-light-blue text-lumon-blue z-10 flex h-10 w-10 items-center justify-center rounded-full">
                    5
                  </div>
                  <span className="text-lumon-light-blue mt-2 text-sm font-medium">
                    Payment
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for each step - Using the client component */}
          <div className="border-lumon-blue bg-lumon-light-blue/30 mx-auto max-w-4xl rounded-lg border shadow-md">
            <ProcessTabs />
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <blockquote className="text-center">
            <p className="text-lumon-blue mb-6 text-2xl font-light italic">
              "The work is mysterious and important."
            </p>
            <footer className="text-slate-500">
              — Harmony Cobel, Chief of Lumon Severed Floor
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-lumon-blue py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-light">Ready to serve Kier?</h2>
          <p className="text-lumon-light-blue mx-auto mb-8 max-w-2xl">
            Join Lumon Industries and experience the perfect balance of purpose,
            security, and fulfillment.
          </p>
          <Button className="bg-lumon-light-blue text-lumon-blue hover:bg-lumon-light-blue/90 rounded-sm px-6">
            Apply for Severance
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-lumon-light-blue/30 py-8 text-slate-600">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">
                © 2023 Lumon Industries. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="hover:text-lumon-blue text-sm">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-lumon-blue text-sm">
                Severance Agreement
              </Link>
              <Link href="#" className="hover:text-lumon-blue text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
