# Syntho

Official frontend for [syntho.cc](https://syntho.cc) — autonomous trading intelligence native to the Internet Computer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The UI reads a deterministic mock dataset through `src/lib/data`. Swap that module for canister calls when the Syntho canisters are deployed.

## Internet Identity

Sign in uses [Internet Identity](https://identity.ic0.app). Session is stored in IndexedDB and restored on reload. Routes stay public; identity is not used for canister calls yet.

Copy `.env.example` to `.env.local` if you need to override the provider:

```
NEXT_PUBLIC_II_URL=https://identity.ic0.app
```

Local replica (optional):

```
NEXT_PUBLIC_ICP_NETWORK=local
NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943
NEXT_PUBLIC_II_URL=http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943
```

The Next.js app is not wired to canisters yet. Backend setup, deploy, and `dfx canister call` examples live in [`backend/README.md`](backend/README.md).
