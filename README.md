# Purser Relay

Maintainers need to replace an AI executor without sharing the principal wallet key or paying the same business order twice. Purser Relay assigns two restricted worker slots to an immutable, prepaid order on Monad Testnet. The owner can atomically replace an active worker with a genuinely new address. A late worker cannot consume the order after replacement, and two different workers cannot pay its principal twice.

**Research prototype, private publication candidate.** Native test MON, controlled synthetic seller/report. No hosted production service, customers, revenue, real third-party delivery guarantee or measured throughput advantage. This repository is prepared for MIT open-source publication; it has not been published or submitted to Metropolis.

## Actual Monad evidence

- Chain: Monad Testnet **10143** (not mainnet 143).
- Contract: `0xae6545e105f4b852f74f949b7107928d2db9db01`.
- Deployment and runtime codehash: `evidence/testnet-deployment.json`.
- Real two-worker race, replacement/late-worker failure, SIGKILL and independent process recovery: `evidence/testnet-demo.json`.
- Successful and reverted transaction fees and all three worker balance differentials: `evidence/testnet-fee-audit.json`.
- Additional real terminal-state/permission cases: `evidence/testnet-negative.json`.
- WS Verified heads: `evidence/demo-verified-heads.json` and per-process `.verified.json` files. `blockId` is not an EVM `hash`.
- Local Solidity tests cover reentrancy, rejecting seller/owner, forced donations and exact expiry boundaries. These are **local tests**, not claimed public-chain attack executions.

## Scope and guarantees

An owner permanently reserves `owner + businessIntentID`. Financial terms (seller, principal, request hash, expiry, chain/contract) never change. Principal belongs to one order and goes once to its fixed seller, or returns to its owner after expiry. Forced donations do not enlarge orders and cannot be withdrawn. A revoked or replaced worker is never reauthorized for that order. **Revoke permanently seals that slot; you must use atomic replace while the old worker is active to pass that slot on.** Pending owner transactions are not effective permissions.

The contract prevents duplicate principal within one owner/intent domain, not an owner intentionally inventing a new intent for the same semantic purchase. Gas remains payable on failed attempts. Standard signed-authorization nonces and raw transaction replay already solve narrower retry cases; this prototype handles distinct restricted signer identities and durable business-order handoff, and does not claim those primitives are new inventions.

The owner keeps a separate credential file. Worker CLI reads only its own role credential and can sign only exact `consumeOrder` calls. Read-only recovery exposes no signing/order creation API. Handoff JSON contains no owner key. Local files are not hardened isolation between mutually hostile OS users; use separate OS/security domains in production. Local gas envelopes constrain this client only, not a malicious worker paying its own gas elsewhere.

## Verified payment gate and recovery bounds

A production tracker subscribes to **`monadNewHeads`** at the official `wss://testnet-rpc.monad.xyz`, accepts only actual `Verified` messages and keeps their EVM hash, parent hash, number and separate Monad blockId. Proposed/Voted/Finalized alone never upgrade this prototype's payment gate. No guessed wait duration or height offset is substituted for Verified.

Recovery reads code and order state at the **same observed Verified snapshot F**, binds chain/contract/codehash/schema and owner/intent/creation proof, finds exactly one matching OrderPaid at paidBlock N, checks its successful receipt and transaction, then explicitly walks canonical parent hashes from F to N. Evidence is RPC-trusting, not a Merkle proof or light client. The default maximum is **256 ancestor headers** (roughly 77 seconds at ~300ms blocks, or 102 seconds at ~400ms; not a guaranteed duration). Outside this block bound, missing historical state/headers, stream disconnect, absent receipt or contradictions means **unknown and human handoff**, with no auto-repayment, released principal or new intent. No arbitrary overnight automatic recovery claim is made.

Verified/checkpoint histories and resolved evidence are persisted. They document the previously observed acceptance result; replay of saved evidence is labelled separately from a new current-chain check. Saved evidence does not magically provide unavailable archival state. A current check outside the supported bound can remain unknown while recorded prior acceptance remains inspectable. Recovery CLI ignores the lost worker journal and discovers the transaction from order state/event; it needs the owner-approved immutable handoff.

Payment and delivery are separate. A missing synthetic artifact is **paid / undelivered**. Invalid schema is **rejected**. A schema match does not attest factual report quality or guarantee external seller availability. No exactly-once external side effects claim.

## Install and verify

Requirements: Node >=20.19, npm, Foundry (forge/cast), Solidity 0.8.28. No paid infrastructure is required. Hyperframes local video tooling, when used, needs Node >=22 (production used local Node 24).

```sh
npm ci
forge build
forge test
npm run typecheck
npm test
python3 scripts/mutations.py
python3 scripts/ts-mutations.py
node --import tsx scripts/journal-interleaving.ts
```

The deliberate bad versions remove intent uniqueness, revoked-slot enforcement, ever-authorized checks, request binding, canonical ancestry checks and correct gasLimit accounting. The exact two-process journal barrier reproduces the former read-before-lock overwrite: fixed implementation preserves both attempts/raw/txHash; broken version drops the new signature. Permanent-intent cancellation uses a **valid future expiry** and exact DuplicateIntent selector so it cannot pass merely because another validation rejects the request.

## Local operator interface

```sh
npm run serve
```

Open `http://127.0.0.1:18813`. Four columns show authority, payment, delivery and gas/handoff. Cases select **recorded real testnet acceptance**, with its timestamp. “Check current Verified snapshot” performs read-only live reconciliation, and may fail closed outside the bound. “Retrieve controlled artifact” checks a synthetic artifact against recorded real payment evidence; its basis is labelled. The workbench has **no key or signing endpoint** and binds only loopback. Existing evidence is needed; no worker transactions run automatically on server start.

## Separate owner/worker console

Secret credentials live outside this repository, in `~/.config/agent3/purser-relay`, mode700 directory and mode600 role files. `npm run wallets` generates new disposable testnet identities once. Scripts never print private keys. The account holding principal is separate from worker gas EOAs. Default test funding and owner transaction fee caps are for valueless test MON only.

The official free developer path is `https://faucet.monad.xyz`: enter the fresh owner address and request test MON. No social account was connected or manual CAPTCHA/challenge bypass used. `evidence/faucet-balance.json` captures chain10143 raw block/balance reads; the observed faucet UI supplied no claim transaction hash, so no credit receipt is invented.

`owner-cli.ts create` requires an explicit immutable approval JSON (`owner`, permanent `intent`, private normalized `request`, fixed `seller`, `amount`, `expiry`, `workerA`, `workerB`). It persists that approval before signing, refuses changed retry approval and never generates a new intent on recovery. Owner replace/revoke/cancel are separate actions signed with the owner credential; the worker receives only the resulting handoff. All raw signed transactions are durable in ignored `runtime/` before broadcast; an unknown signing boundary stops for human inspection. A crash leaving an exclusive lease never causes automatic lock stealing.

```sh
node --import tsx scripts/owner-cli.ts create approval.json runtime/order-handoff.json
node --import tsx scripts/worker-cli.ts consume workerA runtime/order-handoff.json runtime/workerA.order.json runtime/workerA.result.json
node --import tsx scripts/worker-cli.ts recover workerB runtime/order-handoff.json runtime/workerB.order.json runtime/workerB.result.json
```

These commands are examples and are not required of an end user reviewing the demo. Test scripts are explicit developer entry points; `testnet-demo.ts` and `testnet-negative.ts` spend valueless test MON on bounded verification only. Do not run on mainnet. The scripted SIGKILL occurs after a worker broadcasts and before it reports its result to the controller; it demonstrates process interruption, not a real external server blackout. A failed attempt receipt never overrides another worker's successful business payment.

## Prior work and AI disclosure

Purser existed before this build and was submitted to Tameion and Colosseum. The Colosseum build had local Anvil native-ETH, single-host journals and OS-lock recovery; a correctly integrated SDK matched its recovery outcomes. That submitted project, source and media have not been changed.

**This separate build adds:** native MON immutable-intent escrow, owner-only atomic active-worker replacement, permanent worker tombstones, competing independent gas EOAs/journals, snapshot-bound actual WS Verified + event/receipt/canonical ancestry reconciliation, independent-process recovery and gas fee evidence. These new files were authored during the Metropolis build window.

Codex AI assistance was used for implementation, testing, documentation and local presentation. The local demo uses actual workbench screenshot sequences, clearly labelled edited/recorded testnet footage and controlled synthetic artifacts. Its narration/audio status is stated in video production metadata. Dependencies: Solidity compiler/Foundry; viem (MIT); ws (MIT); TypeScript/tsx; local Hyperframes for media. Cite their licenses when redistributing dependencies; `node_modules` is excluded. No copied employer code or confidential material.

## Submission status

The formal rules require a public complete GitHub repository with open-source license/build-window history, actual Monad deployment, <=3-minute accessible demo and disclosed substantial new work/AI tooling. Repo/video remain **local/private candidates** pending human publication authorization. Registration, real Zhuqing OAuth mapping/social link, new agreements, eligibility facts and final submission remain separate gates.
