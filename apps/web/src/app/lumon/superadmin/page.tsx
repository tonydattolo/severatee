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
import {
  Loader2,
  Wallet,
  AlertCircle,
  DatabaseIcon,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState("wallets");

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">Lumon Super Admin</h1>

      <Tabs
        defaultValue="wallets"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-8 grid grid-cols-3">
          <TabsTrigger value="wallets">Wallet Management</TabsTrigger>
          <TabsTrigger value="nillion">Nillion Management</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <WalletManagement />
        </TabsContent>

        <TabsContent value="nillion">
          <NillionManagement />
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

const BlurredText = ({ text }: { text: string }) => {
  const shouldBlur = (text: string) => {
    // Check for both direct matches and JSON string matches
    const sensitivePatterns = [
      /https:\/\/nildb-[^"]*\.nillion\.network/,
      /did:nil:testnet:[^"']*/,
    ];
    return sensitivePatterns.some((pattern) => pattern.test(text));
  };

  // If the line contains sensitive info, blur the whole line
  const isBlurred = shouldBlur(text);
  return (
    <span className={cn("font-mono", isBlurred && "blur-[4px] select-none")}>
      {text}
    </span>
  );
};

function NillionManagement() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [schemaOutput, setSchemaOutput] = useState<any>(null);

  const createSchemaMutation = api.lumon.nillionCreateSchema.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      setSchemaOutput(data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      setSuccess(false);
      setSchemaOutput(null);
    },
  });

  const handleCreateSchema = async () => {
    try {
      createSchemaMutation.mutate();
    } catch (err) {
      setError("Failed to create Nillion schema");
      console.error(err);
    }
  };

  const formatSchemaOutput = (output: any) => {
    if (!output) return [];

    return JSON.stringify(output, null, 2)
      .split("\n")
      .map((line) => {
        // Add extra spaces to maintain JSON formatting
        const indent = line.match(/^\s*/)?.[0] || "";
        return `${indent}${line.trim()}`;
      });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nillion Schema Management</CardTitle>
          <CardDescription>
            Create and manage Nillion schemas for Lumon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleCreateSchema}
              disabled={createSchemaMutation.isPending}
              className="w-fit"
            >
              {createSchemaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Schema...
                </>
              ) : (
                <>
                  <DatabaseIcon className="mr-2 h-4 w-4" />
                  Create Lumon Task Schema
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

            {success && (
              <Alert variant="default" className="bg-input/30">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Success</AlertTitle>
                <AlertDescription className="text-green-600">
                  Lumon Task schema created successfully in Nillion
                </AlertDescription>
              </Alert>
            )}

            {schemaOutput && (
              <div className="bg-input/30 mt-4 rounded-md border p-4">
                <h3 className="mb-2 font-medium">Schema Creation Output:</h3>
                <pre className="text-sm whitespace-pre">
                  {formatSchemaOutput(schemaOutput).map((line, i) => (
                    <div key={i} className="font-mono">
                      <BlurredText text={line} />
                    </div>
                  ))}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
