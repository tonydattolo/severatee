"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState("wallets");

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Lumon Super Admin</h1>

      <Tabs
        defaultValue="wallets"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-8 grid grid-cols-3">
          <TabsTrigger value="wallets">Wallet Management</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <WalletManagement />
        </TabsContent>

        {/* <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>System settings functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}

function WalletManagement() {
  const [walletResult, setWalletResult] = useState<{
    id: string;
    address: string;
    chainType: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const createWalletMutation = api.wallets.createPrivyWallet.useMutation({
    onSuccess: (data) => {
      setWalletResult(data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      setWalletResult(null);
    },
  });

  const handleCreateWallet = async () => {
    try {
      createWalletMutation.mutate();
    } catch (err) {
      setError("Failed to create wallet");
      console.error(err);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Privy Wallet Creation</CardTitle>
          <CardDescription>Create and test Privy wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleCreateWallet}
              disabled={createWalletMutation.isPending}
              className="w-fit"
            >
              {createWalletMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Create New Privy Wallet
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {walletResult && (
              <div className="bg-muted mt-4 rounded-md border p-4">
                <h3 className="mb-2 font-medium">
                  Wallet Created Successfully:
                </h3>
                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="font-medium">Wallet ID:</span>{" "}
                    {walletResult.id}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{" "}
                    {walletResult.address}
                  </div>
                  <div>
                    <span className="font-medium">Chain Type:</span>{" "}
                    {walletResult.chainType}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Management</CardTitle>
          <CardDescription>View and manage existing wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Wallet listing and management functionality will be implemented
            here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
