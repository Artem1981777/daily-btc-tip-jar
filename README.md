# ₿ Daily BTC Tip Jar

A decentralized micro-tipping dApp on **OPNet Testnet** — drop sats into a shared jar, once per wallet per day.

## Quick Start
```bash
cd frontend
npm install && npm run dev
```

## Stack
- Contract: AssemblyScript (OPNet WASM)
- Frontend: React + Vite + TypeScript
- Wallet: OP_WALLET
- Network: OPNet Testnet

## Deploy
- Vercel: set root to `frontend`, add env vars
- Netlify: `netlify.toml` at root handles everything

## Security
- ML-DSA quantum-safe signatures
- Null signer guard on all entry points
- Simulate before send (mandatory)
