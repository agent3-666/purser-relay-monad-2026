# Architecture and trust boundaries

Owner approval (immutable intent/request/terms) → PurserRelay escrow → two restricted worker slots → fixed synthetic seller.

Worker role credential → gas-budget envelope → exclusively leased journal → durable signed raw transaction → consumeOrder only. A process crash leaves raw/unknown evidence, never regenerates a business intent. Receipt updates take the same lease **before reading**. SIGKILL after send is the explicit controlled process fault.

Owner CLI is separate. Create requires a persisted original approval; replace/revoke/cancel require owner authority. Handoff carries domain/schema/codehash/intent/terms/creation proof/private normalized request but no owner credential. Separate role files demonstrate principal-key isolation in the workflow, not hostile-OS isolation.

Read-only reconciler → official WS monadNewHeads Verified snapshot → HTTP same-snapshot code/state → immutable owner-intent and creation receipt/event → exact paidBlock event and successful receipt → explicit parent-hash ancestry → paid. Missing evidence → unknown/human. No payment/signing/create capability exists in the recovery API. Error responses never imply unpaid budget release.

Controlled artifact adapter → schema acceptance after verified payment. Missing body remains undelivered; rejected schema never causes a second purchase. A controlled synthetic report is not a real supplier integration or quality guarantee.

UI → loopback read-only API. Recorded real testnet acceptance is labelled with timestamp. Fresh recheck is separate and can return unknown due to 256-header/historical-state limits. Synthetic artifact inspection uses recorded acceptance and explicitly labels this basis. No wallet secrets/signing endpoint; no public deployment. Code is portable to other EVMs. Independent order balances and independent worker nonces fit Monad workloads, but the global reentrancy guard touches shared state and no TPS gain is claimed.

Evidence archive: successful/reverted receipts, exact codehash, fee balance differentials, actual Verified headers/ancestry, local adversarial and deliberately broken tests, real process interruption, source manifest and media provenance. This is an inspectable testnet prototype, not an audited production financial system.
