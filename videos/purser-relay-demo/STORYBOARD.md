---
format: 1920x1080
duration: 90s
message: Change the agent. Keep the order and owner control.
arc: Control → Race → Replacement → Recovery → Delivery → Evidence boundary
audience: hackathon reviewers
mode: autonomous
music: none
---

## Video direction
Code-editorial preset cream canvas, dark ink, terracotta accent. Actual UI screenshots as evidence plates, unchanged and fit inside a clear frame. Text has its own side rail or top title. Smooth line-by-line-slide text entrances distributed across the full beat, then held read. Deliberate hard cuts: each new case is a distinct recorded scene, no continuity implied. Opening/end title cards use calm titlecard-reveal; evidence uses composed asymmetric layout. No decorative drift, artificial cursor clicks, fabricated UI, stock photos or unsupported product claims. Persistent lower band states: EDITED RECORDED TESTNET · CONTROLLED SELLER · SILENT. All content above y=885; footer itself owns caption band.

## Frame 1 — Owner control

- scene: Keep the task moving. Keep control of the money.
- voiceover: 
- duration: 12s
- transition_in: cut
- status: animated
- src: compositions/frames/01-scene.html
- type: hook
- persuasion: Show-don't-tell proof
- beat: control
- blueprint: compose
- focal: title typography
- asset_candidates: 
- roles: typography = focal
- registry_component: line-by-line-slide

narrativeRole: Owner control and bounded authority.
keyMessage: Keep the task moving. Keep control of the money.
Scene 1 (0–3.6s): title and Agent3 / Purser Relay identity seat; clean centered hierarchy.
Scene 2 (3.6–6.6s): line-by-line-slide reveals: Agent3 / Purser Relay
Scene 3 (6.6–9.4s): line-by-line-slide reveals: The owner fixes seller, amount and request.
Scene 4 (9.4–12s): final line enters, then all hold: Workers get scoped permission, never the principal wallet key.
## Frame 2 — Concurrent workers

- scene: Two workers. One principal payment.
- voiceover: 
- duration: 14s
- transition_in: cut
- status: animated
- src: compositions/frames/02-scene.html
- type: proof
- persuasion: Show-don't-tell proof
- beat: control
- blueprint: compose
- focal: assets/ui-race.png
- asset_candidates: assets/ui-race.png — actual provided UI screenshot
- roles: assets/ui-race.png = supporting
- registry_component: line-by-line-slide

narrativeRole: One-payment evidence without free-retry claims.
keyMessage: Two workers. One principal payment.
Scene 1 (0–4.2s): title and actual screenshot evidence plate seat; clean asymmetric 35/65 hierarchy.
Scene 2 (4.2–7.7s): line-by-line-slide reveals: A and B race on the same business order.
Scene 3 (7.7–10.9s): line-by-line-slide reveals: One succeeds; the losing transaction reverts.
Scene 4 (10.9–14s): final line enters, then all hold: Both attempts consume gas. Paid still means undelivered until artifact retrieval.
## Frame 3 — Replace and recover

- scene: Change the worker. Keep the business order.
- voiceover: 
- duration: 18s
- transition_in: cut
- status: animated
- src: compositions/frames/03-scene.html
- type: proof
- persuasion: Show-don't-tell proof
- beat: control
- blueprint: compose
- focal: assets/ui-replace.png
- asset_candidates: assets/ui-replace.png — actual provided UI screenshot
- roles: assets/ui-replace.png = supporting
- registry_component: line-by-line-slide

narrativeRole: Recovery after real process death.
keyMessage: Change the worker. Keep the business order.
Scene 1 (0–5.4s): title and actual screenshot evidence plate seat; clean asymmetric 35/65 hierarchy.
Scene 2 (5.4–9.9s): line-by-line-slide reveals: The owner atomically replaces A with C, keeping the same intent.
Scene 3 (9.9–14.0s): line-by-line-slide reveals: Late A reverts. C pays, then the process is actually killed with SIGKILL.
Scene 4 (14.0–18s): final line enters, then all hold: B independently recovers PAID from chain evidence without C’s local journal.
## Frame 4 — Missing delivery

- scene: Paid is not complete.
- voiceover: 
- duration: 16s
- transition_in: cut
- status: animated
- src: compositions/frames/04-scene.html
- type: proof
- persuasion: Show-don't-tell proof
- beat: control
- blueprint: compose
- focal: assets/ui-missing.png
- asset_candidates: assets/ui-missing.png — actual provided UI screenshot
- roles: assets/ui-missing.png = supporting
- registry_component: line-by-line-slide

narrativeRole: Separate delivery from payment.
keyMessage: Paid is not complete.
Scene 1 (0–4.8s): title and actual screenshot evidence plate seat; clean asymmetric 35/65 hierarchy.
Scene 2 (4.8–8.8s): line-by-line-slide reveals: The payment is verified, but the controlled seller artifact is missing.
Scene 3 (8.8–12.5s): line-by-line-slide reveals: Delivery stays UNDELIVERED. Hand off to a human; never repay.
Scene 4 (12.5–16s): final line enters, then all hold: Replacement case reaches COMPLETE only after controlled artifact retrieval.
## Frame 5 — Bounded verification

- scene: Evidence gaps stop the claim.
- voiceover: 
- duration: 16s
- transition_in: cut
- status: animated
- src: compositions/frames/05-scene.html
- type: proof
- persuasion: Show-don't-tell proof
- beat: control
- blueprint: compose
- focal: assets/ui-unknown.png
- asset_candidates: assets/ui-unknown.png — actual provided UI screenshot
- roles: assets/ui-unknown.png = supporting
- registry_component: line-by-line-slide

narrativeRole: Explicit fail-closed verification boundary.
keyMessage: Evidence gaps stop the claim.
Scene 1 (0–4.8s): title and actual screenshot evidence plate seat; clean asymmetric 35/65 hierarchy.
Scene 2 (4.8–8.8s): line-by-line-slide reveals: Live WebSocket Verified heads + receipt/event + fixed order terms.
Scene 3 (8.8–12.5s): line-by-line-slide reveals: Canonical parent-hash ancestry is bounded to 256 headers.
Scene 4 (12.5–16s): final line enters, then all hold: Outside the bound: UNKNOWN. Read-only check, no new payment. RPC trust, not a light-client proof.
## Frame 6 — Scope and receipts

- scene: A recorded testnet demo you can inspect.
- voiceover: 
- duration: 14s
- transition_in: cut
- status: animated
- src: compositions/frames/06-scene.html
- type: brand_outro
- persuasion: Show-don't-tell proof
- beat: control
- blueprint: compose
- focal: title typography
- asset_candidates: 
- roles: typography = focal
- registry_component: line-by-line-slide

narrativeRole: Truthful contribution and provenance.
keyMessage: A recorded testnet demo you can inspect.
Scene 1 (0–4.2s): title and Agent3 / Purser Relay identity seat; clean centered hierarchy.
Scene 2 (4.2–7.7s): line-by-line-slide reveals: Prior Purser: single-host handoff workflow.
Scene 3 (7.7–10.9s): line-by-line-slide reveals: Relay adds scoped on-chain worker permissions and independent recovery.
Scene 4 (10.9–14s): final line enters, then all hold: Native MON testnet 10143. Controlled synthetic seller/artifact. No customer, TPS or cross-chain performance claim.

## Production timing note
Silent reading timings supersede initial Scene estimates: frame01 lines at1.0/3.5/6.5s; frame02at1.5/4.5/7.5; frame03at1.5/5.5/9.5; frames04/05at1.5/5/8.5; frame06at1.5/4.5/7.5. Longer held reads support full subtitle comprehension; no narration or standalone captions.
