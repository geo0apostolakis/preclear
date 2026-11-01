# Preclear

Pre-trade clearance for tokenized stocks. Five checks must all say yes
before a trade intent reaches a router.

Tokenized equities settle on-chain in seconds, and nothing in that path asks
whether the trade was allowed. Preclear is that question, written as a pure
function: is the price feed fresh and sane, is the market open, is the asset
on the mandate, is the session within budget, and is the route the one that was
approved. Every decision, cleared or blocked, leaves a receipt with a reason
code. Built against Robinhood Chain (chain id 4663).

Next.js 16 (App Router) + TypeScript + Tailwind 4. Static, no backend, Vercel-ready.

```bash
npm install
npm run dev
npm run build
npx tsx scripts/gate.check.ts    # 20 assertions against the gate engine
npx tsx scripts/agent.check.ts   # 12 assertions against agent + rebalancer
```

## Pages

| Route | What it does |
|---|---|
| `/` | Landing. WebGL gradient hero, ticker marquee, problem, five checks, comparison table |
| `/dashboard` | Clearance console, behind a wallet gate. Agent, rebalancer, session delegation, intent tester, activity |
| `/markets` | What Feed Check and Window Check see: oracle age, pool deviation, venue session |
| `/policy` | Mandate Vault settings. Allowlist, caps, feed rules. Versioned on commit |
| `/sessions` | Delegated sessions. Create, select, revoke. Budget and expiry enforced |
| `/audit` | Every receipt, cleared or blocked, with filters and search |

## Console modules (`/dashboard`)

Gated behind a real EIP-1193 connection on chain 4663.

1. **Rule-based agent** - three strategies (momentum, mean reversion, rotation), target pinning,
   trade size, risk tolerance. Auto-pilot scans every 9s. Live execution log. Every scan goes
   through the gate; skips and blocks are logged with their reason.
2. **Portfolio rebalancer** - current weights from real positions, target weight sliders, drift
   tolerance, advisory. Each corrective leg is evaluated separately, so some clear and some block.
3. **Session delegation** - budget, per-trade cap, window. Creates and selects in one click.
4. **Manual intent tester** - arbitrary order plus a venue-session bypass for testing while the
   market is closed. The bypass is recorded in the trace, never hidden.
5. **Activity and receipts** - last 8 decisions with source, verdict and reason code.

## What actually works

- **The gate engine** (`lib/gate.ts`) is a pure function covering 13 reason codes. Verified by
  `scripts/gate.check.ts`, 20 assertions, all passing.
- **Policy, sessions and receipts** persist to localStorage and feed back into the engine.
  Revoke a session and the next intent fails `SESSION_REVOKED` for real.
- **Venue session** is real logic: reads the clock in `America/New_York` and applies NYSE
  regular hours 09:30-16:00, Mon-Fri.
- **Wallet connect** is real EIP-1193: `eth_requestAccounts`, chain detection, switch prompt.

## What is simulated, and says so on the page

- **Prices, oracle ages, pool deviations.** Deterministic local simulation, 15s refresh,
  labelled `simulated`. No feed is connected.
- **Receipt ids.** Locally generated, not on-chain hashes.
- **Market holidays.** Not in the calendar. A US holiday currently reads as open.
- **Every contract address.** Nothing is deployed. `MISSING` renders as a dashed red chip.

## Config

Everything content-shaped lives in `config.ts`. `MISSING` is a fact I do not have yet.

## Honesty gate

`resolveStatus()` forces a layer to Roadmap unless it has a real deployed address.
Setting `status: "live"` by hand does nothing.

## Design

Dark glass. Palette in `app/globals.css` as CSS variables, `glass` / `btn-glass` / `btn-accent`
utilities. Hero background is the WebGL shader in `components/ui/animated-gradient.tsx`,
driven by a custom preset. Scroll reveals via `components/Reveal.tsx` (IntersectionObserver,
disconnects after firing, respects `prefers-reduced-motion`).

## Known lint warnings

Four `react-hooks/set-state-in-effect` warnings, downgraded from error in `eslint.config.mjs`:
localStorage hydration, `window.ethereum` feature detection, and the WebGL mount guard. All
three are the correct pattern. Kept as warnings so new instances still surface.
