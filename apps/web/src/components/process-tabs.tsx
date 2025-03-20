"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface TabContent {
  title: string;
  process: string[];
  partners: Array<{
    name: string;
    description: string;
  }>;
  securityNote: string;
}

const tabContents: TabContent[] = [
  {
    title: "User Onboarding & Wallet Assignment",
    process: [
      "User accesses the dApp",
      "Identity verification and wallet creation",
      "Wallet funding for gasless transactions",
    ],
    partners: [
      {
        name: "Privy",
        description: "Identity management & wallet assignment",
      },
      {
        name: "Coinbase Developer Platform",
        description: "Wallet funding & gasless transactions",
      },
    ],
    securityNote:
      'All wallet creation and identity management is handled securely with industry-standard encryption. Your "innie" identity is completely separated from your "outie" identity, ensuring perfect bifurcation.',
  },
  {
    title: "Task Distribution & Assignment",
    process: [
      "Tasks are distributed to innies based on capacity",
      "Work is assigned through secure channels",
      "Task parameters are encrypted and isolated",
    ],
    partners: [
      {
        name: "Nillion",
        description: "Secure task distribution & isolation",
      },
      {
        name: "Altlayer",
        description: "Task management & assignment",
      },
    ],
    securityNote:
      "All task assignments are cryptographically secured and isolated. Your innie receives only the information necessary to complete the assigned task.",
  },
  {
    title: "Secure Computation",
    process: [
      "Data processing occurs in isolated TEE",
      "Computation follows predefined rules",
      "Results are encrypted within the secure environment",
    ],
    partners: [
      {
        name: "Nillion SecretVault",
        description: "Trusted Execution Environment (TEE)",
      },
      {
        name: "Brevis",
        description: "ZK coprocessor for secure data access",
      },
    ],
    securityNote:
      "Computations run in a secure enclave that prevents data leakage. Even system administrators cannot access the raw data being processed.",
  },
  {
    title: "Verification & Proof Generation",
    process: [
      "Zero-knowledge proofs verify computation correctness",
      "Proofs are submitted to the blockchain",
      "Aggregated results are published without revealing details",
    ],
    partners: [
      {
        name: "Succinct",
        description: "Zero-knowledge proof generation",
      },
      {
        name: "t1 Protocol",
        description: "Indexing and verification",
      },
    ],
    securityNote:
      "Zero-knowledge proofs ensure computational integrity without revealing sensitive information. The system can verify that computations were performed correctly without seeing the actual data.",
  },
  {
    title: "Automated Payment & Audit",
    process: [
      "Smart contracts trigger payments based on verified work",
      "Payments are sent to innie wallets",
      "Audit trail is maintained for transparency",
    ],
    partners: [
      {
        name: "Coinbase Developer Platform",
        description: "Payment execution & wallet management",
      },
      {
        name: "Recall Network",
        description: "Encrypted audit trail storage",
      },
    ],
    securityNote:
      "Payments are automatically triggered based on verified performance metrics. The payment system maintains a cryptographically secure audit trail while preserving privacy.",
  },
];

export function ProcessTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="bg-lumon-blue rounded-lg">
      {/* Tab Headers */}
      <div className="flex flex-wrap border-b border-white/20">
        {tabContents.map((tab, index) => (
          <button
            key={index}
            className={`px-6 py-3 font-medium ${
              activeTab === index
                ? "bg-lumon-light-blue text-lumon-blue border-lumon-blue border-b-2"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {index === 0
              ? "Onboarding"
              : index === 1
                ? "Task Assignment"
                : index === 2
                  ? "Computation"
                  : index === 3
                    ? "Verification"
                    : "Payment"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-lumon-light-blue p-6">
        <h3 className="text-lumon-blue mb-4 text-xl font-medium">
          {tabContents[activeTab]?.title}
        </h3>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="text-lumon-blue mb-2 font-medium">Process</h4>
            <ul className="space-y-2 text-slate-700">
              {tabContents[activeTab]?.process.map((step, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-lumon-blue mt-1 mr-2 h-2 w-2 rounded-full"></div>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lumon-blue mb-2 font-medium">
              Technology Partners
            </h4>
            <div className="space-y-3">
              {tabContents[activeTab]?.partners.map((partner, index) => (
                <div
                  key={index}
                  className="border-lumon-blue flex items-center rounded-md border bg-white/90 p-3"
                >
                  <div className="bg-lumon-blue mr-3 h-8 w-8 rounded-full"></div>
                  <div>
                    <h5 className="text-lumon-blue font-medium">
                      {partner.name}
                    </h5>
                    <p className="text-sm text-slate-600">
                      {partner.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-lumon-blue border-lumon-blue rounded-md border bg-white/90 p-4">
          <h4 className="mb-2 font-medium">Security Note</h4>
          <p className="text-sm">{tabContents[activeTab]?.securityNote}</p>
        </div>
      </div>
    </div>
  );
}
