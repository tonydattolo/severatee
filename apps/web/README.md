# Severatee

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Overview

TEE‑track project concept—“Cold Harbor Vault”—that mirrors the Severance universe. In this simulation, “innies” perform secure data refinement tasks inside TEEs, while “outties” (managers) receive only aggregated insights and automated payments without direct visibility into the granular inner computations.
Cold Harbor Vault Overview

Inspired by the Severance show’s dual‑persona structure, Cold Harbor Vault assigns each “innie” a unique, privacy‑preserving wallet (using Privy) to conduct work behind the scenes. Inside a Nillion‑powered Trusted Execution Environment (TEE), innies perform simple macro data refinement (e.g., calculating a “Refined Data Score” from input data). A zero‑knowledge proof (via Succinct and Brevis) validates each computation, while aggregated metrics are published to an L2 smart contract (via Altlayer) that automatically triggers payments using Coinbase Developer Platform tools—all without revealing sensitive details to the “outties.”
Software Architecture

1. User Onboarding & Wallet Assignment

   dApp Interface & Identity Management:
   Privy: Onboards users, assigns each innie a unique wallet.
   Coinbase Developer Platform: Provides wallet funding/gasless transactions for seamless user experience.

2. Task Distribution & Secure Computation

   Task Management:
   The dApp assigns work tasks (e.g., “Process Macro Data X”) to each innie.
   Secure Compute Environment:
   Nillion SecretVault: Hosts the TEE where computations run in an isolated, encrypted environment.
   Innie Agents: Within the TEE, these agents perform data refinement tasks (e.g., compute a “Refined Data Score” based on pre‑defined rules).

3. Proof Generation & Data Privacy

   Computation Integrity:
   Succinct: Generates zero‑knowledge proofs attesting to the correctness of the refined data, without exposing raw inputs.
   Brevis: Acts as a ZK coprocessor that securely reads on‑chain data and integrates risk control metrics into the proof.
   Privacy Preserving Output:
   Only aggregated, non‑sensitive metrics are revealed to the external system, protecting the detailed inner workings.

4. Aggregation, Audit, and Payment Execution

   On‑chain Aggregation:
   Altlayer: Hosts smart contracts that record aggregated performance scores and trigger payment events.
   Payment Processing:
   Coinbase Developer Platform: Executes automated payments to innies based on validated performance metrics.
   Indexing & Audit Trail:
   t1 Protocol: Indexes transaction events and computation results for transparency.
   Recall Network: Stores encrypted logs and audit trails off‑chain, ensuring data integrity without exposing sensitive details.

Technical Flow Diagram

    User Onboarding:
        Innie accesses the dApp → Privy assigns a wallet.
        Coinbase Developer Platform ensures wallet readiness (e.g., gasless funding).

    Task Assignment & Secure Computation:
        dApp distributes a task (“Process Macro Data X”) to the innie.
        Innie’s request is sent to the Nillion TEE (SecretVault), where a dedicated in‑enclave agent runs the computation.

    Computation & Zero‑Knowledge Proof Generation:
        The TEE performs data refinement (e.g., calculates a score).
        Succinct generates a ZK proof of correct computation, with Brevis ensuring any on‑chain data dependencies are met.
        The TEE encrypts detailed results; only the aggregated score and proof are output.

    Aggregation & Verification:
        The aggregated result and its ZK proof are submitted to an Altlayer smart contract.
        The contract verifies the proof (ensuring computation integrity) and updates the public dashboard without revealing sensitive details.

    Automated Payment & Audit:
        Once verified, the smart contract triggers a payment transaction via Coinbase Developer Platform to the innie’s Privy‑managed wallet.
        t1 Protocol indexes the event for real‑time tracking.
        Recall Network securely stores an encrypted record of the transaction and computation for audit purposes.

Sponsor Integration Summary
Sponsor Role in Cold Harbor Vault
Privy Onboarding and wallet assignment for innies
Coinbase Developer Platform Funding transactions and executing automated payments
Nillion SecretVault Providing TEE for secure, isolated computation
Succinct Generating zero‑knowledge proofs to verify computation integrity
Brevis Enabling secure, on‑chain data reads and risk control integration
Altlayer Hosting smart contracts for aggregation and payment triggers
t1 Protocol Indexing and exposing transparent aggregated metrics
Recall Network Off‑chain encrypted storage of logs and audit trails
Final Remarks

Cold Harbor Vault elegantly simulates a Severance‑inspired division of labor: innies perform private, secure computations, while outties—through smart contract aggregation and indexed metrics—only see sanitized, aggregated outputs. This ensures that the sensitive inner workings remain confidential while still enabling a fully automated, blockchain‑based payment system and audit trail that leverages the full spectrum of sponsoring technologies.

# Tickets

Ticket 1: Innie Onboarding & Wallet Assignment

Description:
Set up the dApp’s onboarding flow so that each “innie” is registered and assigned a unique wallet. Integrate with Privy for wallet creation and Coinbase Developer Platform for seamless, gasless funding.

Tasks:

    Frontend Integration:
        Implement a sign-up/login screen.
        Integrate with Privy’s API for wallet creation.
        Display wallet details to the user.
    Backend Service:
        Create a service that listens for new wallet creation events.
        Call Coinbase Developer Platform APIs to fund wallets with gasless transactions.
    Testing:
        Ensure wallet creation and funding work end-to-end.
        Verify error handling if wallet assignment fails.

Purpose:
This ticket ensures that each innie is uniquely identified and equipped with a secure, funded wallet, which is critical for executing subsequent secure transactions.
Ticket 2: Task Distribution & dApp Interface for Work Assignments

Description:
Develop the user interface and backend logic that assigns data refinement tasks to innies. This module will allow the system to distribute tasks (e.g., “Process Macro Data X”) securely.

Tasks:

    Frontend Development:
        Build a dashboard displaying available tasks and individual task details.
        Implement task assignment UI that shows the status of each task.
    Backend Logic:
        Create an API to assign tasks to innies based on their availability.
        Log task assignments for audit and indexing.
    Integration:
        Ensure the task data can be securely passed to the TEE computation module.
    Testing:
        Validate that tasks are assigned correctly and reflected in the user dashboard.

Purpose:
This ticket sets up the workflow for task distribution, ensuring that work is correctly routed to the appropriate secure compute environment.
Ticket 3: Secure Computation Module in Nillion SecretVault TEE

Description:
Develop the module that runs inside the Nillion SecretVault TEE. This module will process the assigned data refinement tasks and compute the “Refined Data Score” for each innie.

Tasks:

    TEE Integration:
        Set up the Nillion SecretVault environment.
        Develop the in‑enclave agent code that executes the data refinement algorithm.
    Computation Logic:
        Define the algorithm for macro data refinement.
        Ensure that the computation happens in an isolated, encrypted environment.
    Logging & Output:
        Log computation events internally without exposing raw data.
        Prepare the output for subsequent proof generation.
    Testing:
        Validate that the TEE performs computations correctly and securely.
        Simulate task execution with test data.

Purpose:
This ticket guarantees that all sensitive computations occur within a trusted, isolated environment, protecting the details of innie work from external visibility.
Ticket 4: Zero‑Knowledge Proof Generation (Succinct & Brevis Integration)

Description:
Integrate Succinct to generate zero‑knowledge proofs that validate the correctness of each computation. Incorporate Brevis as a ZK coprocessor to securely read necessary on‑chain data and add risk control measures.

Tasks:

    ZK Proof Setup:
        Integrate the Succinct library into the TEE module.
        Define the proof structure for the “Refined Data Score.”
    Brevis Integration:
        Integrate Brevis to fetch on‑chain data required for risk control.
        Ensure the fetched data is combined securely with computation outputs.
    Proof Validation:
        Implement endpoints to validate proofs before publishing aggregated results.
    Testing:
        Create unit tests for proof generation and validation.
        Verify that proofs do not leak sensitive computation details.

Purpose:
This ticket provides a mechanism to prove computation integrity without exposing raw data, ensuring that only aggregated, non‑sensitive outputs are shared.
Ticket 5: Aggregation & Smart Contract Development on Altlayer

Description:
Develop smart contracts on the Altlayer platform to aggregate verified computation results. The contract will receive the aggregated scores and ZK proofs, then trigger automated payment transactions.

Tasks:

    Smart Contract Design:
        Draft contract architecture that accepts aggregated results and proofs.
        Define events for proof verification, score aggregation, and payment triggers.
    Coding & Deployment:
        Code the contract in Solidity (or the appropriate language).
        Deploy the contract on the designated L2 environment.
    Integration:
        Create APIs to interface between the TEE output module and the smart contract.
        Integrate with t1 Protocol for event indexing.
    Testing:
        Write unit tests to verify correct contract behavior.
        Simulate end-to-end scenarios from proof submission to payment trigger.

Purpose:
This ticket ensures that validated computation results are transparently aggregated on-chain, and that automated payments can be executed based on these results.
Ticket 6: Payment Execution Integration Using Coinbase Developer Platform

Description:
Integrate the Coinbase Developer Platform to automate payments to innies upon successful aggregation and proof verification.

Tasks:

    Payment API Integration:
        Develop an API endpoint in the smart contract that calls Coinbase Developer Platform for payments.
        Ensure that the payment amount is calculated based on the refined score.
    Transaction Logic:
        Set up logic to trigger payments only after successful proof validation.
        Create fallback procedures for failed transactions.
    Testing:
        Run simulations to ensure payment transactions are triggered correctly.
        Validate the secure and gasless nature of transactions.

Purpose:
This ticket guarantees that innies are automatically compensated in a secure and transparent manner once their work has been validated.
Ticket 7: Transaction Indexing & Audit Trail with t1 Protocol

Description:
Integrate t1 Protocol to index all on-chain events related to task assignments, proof submissions, and payments. This indexing will create a transparent audit trail for the entire process.

Tasks:

    Event Capture:
        Define and capture events from the smart contract (e.g., task assigned, proof verified, payment made).
    Integration Setup:
        Configure t1 Protocol to index these events.
        Develop API endpoints to query indexed data.
    Dashboard Integration:
        Create a simple admin dashboard to view real-time audit logs.
    Testing:
        Verify that all events are correctly captured and indexed.
        Simulate queries to validate the audit trail.

Purpose:
This ticket provides a transparent and tamper‑proof record of all events in the workflow, essential for both internal audits and external compliance.
Ticket 8: Off‑Chain Encrypted Data Storage with Recall Network

Description:
Integrate Recall Network to securely store encrypted logs and audit trails off‑chain. This is used for deep audits and future compliance reviews without exposing sensitive details.

Tasks:

    Encryption & Storage Setup:
        Develop a service to encrypt logs and computation results.
        Integrate with Recall Network’s API to store encrypted payloads.
    Data Retrieval:
        Create secure endpoints for retrieving stored data for audit purposes.
    Testing:
        Simulate encryption, storage, and retrieval processes.
        Validate that sensitive data is never exposed in plaintext.

Purpose:
This ticket ensures long-term storage of all sensitive logs in an encrypted manner, maintaining data privacy and integrity while allowing for secure audits.
