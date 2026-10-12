# Agent3 / Purser Relay local demo

90-second, 1920×1080 silent demo for independent review. Output: `renders/video.mp4`. An edited sequence of **actual UI screenshots**, with explanatory on-screen text. No artificial clicks or recreated interface. No narration, music or SFX; the persistent footer explicitly marks SILENT.

## Evidence and screenshot source

All four screenshot plates are copied byte-for-byte from `../../evidence/ui-replace.png`, `ui-race.png`, `ui-missing.png`, `ui-unknown.png`. The supervisor captured them from local UI `http://127.0.0.1:18813`. `asset-provenance.json` records SHA-256 digests. The replacement plate shows COMPLETE after an actual controlled artifact retrieval. Race and missing plates show UNDELIVERED. The unknown plate is a **later current read-only check** outside the supported ancestry bound, not the payment-time state.

Real payment evidence: `../../evidence/testnet-demo.json`, `testnet-fee-audit.json` and per-worker evidence files. Monad testnet chain 10143, native test MON. Contract `0xae6545e105f4b852f74f949b7107928d2db9db01`. Run `1791831140339` recorded at 2026-10-12T18:54:33.362Z (2026-10-13 02:54:33 Asia/Shanghai). Controlled synthetic seller and report artifact. No customer adoption, TPS, cross-chain performance, external seller reliability or market-data claim.

## What is demonstrated

The owner fixes seller, amount and request; workers never receive the owner's principal key. Atomic A→C replacement keeps one intent. Late A reverts and is still charged gas. C pays then is really killed by SIGKILL. B recovers payment through chain evidence independently of C's local journal. A missing artifact remains undelivered and is never repaid. A WebSocket Verified observation alone is insufficient: successful receipt/event, exact terms and canonical bounded ancestry are also required. Beyond 256 headers the current check is UNKNOWN. This trusts RPC/WebSocket sources and is not a light-client proof.

Prior Purser was a single-host handoff workflow; Relay adds scoped on-chain worker permissions. Principal and gas remain separate. This edited demo does not initiate new payment.

## Reproduce locally

Requires Node >=22 and local FFmpeg. Use the pinned package scripts from this folder. `npm run check`; `npx hyperframes snapshot --at 6,19,35,52,68,83`; `npx hyperframes preview --background`; `npx hyperframes render --quality delivery --output renders/video.mp4`. No cloud rendering/upload was authorized or used.

## Files for revision

`BRIEF.md` is the approved autonomous scope. `STORYBOARD.md` has six named scenes. `ONSCREEN-TEXT.txt` has all explanatory copy; no `SCRIPT.md` exists because the project is fully silent. `frame.md` uses the shipped code-editorial preset and bundled local fonts. The project is editable in the local HyperFrames Studio preview.
