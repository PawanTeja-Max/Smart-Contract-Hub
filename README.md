# Smart Contract Hub

A modern Soroban smart contract registry + management dashboard.

## Key features

- On-chain smart contract registry with 64-char alphanumeric IDs.
- Internal and external contract onboarding.
- Dashboard for statistics, contract cards, filters, and status indicators.
- Full Soroban React frontend with wallet, cad, and contract calls.
- Existing functions: `register_contract`, `register_external_contract`, `view_contract`, `list_contract_ids`, `view_hub_stats`, `deactivate_contract`.
- Strong error handling against `MissingValue` host errors with safe UI/backend behavior.

## UX / UI (High-fidelity design)

- Dark mode, deep navy + electric cyan accents.
- Glassmorphism panels and soft neon glows.
- Left navigation bar: Dashboard, Contracts, Transactions, Deploy, Settings.
- Top search bar for quick contract filter.
- Main panel with active smart contract cards and status indicators (Active, Audited, Pending/Inactive).
- Responsive for 4K with scaling and mobile fallback.

## Local setup (Android/PC/Mac)

1. Install dependencies:
   - `cd frontend && npm install`
   - `cd contract && cargo test`

2. Install Soroban CLI:
   - `curl --proto '=https' --tlsv1.2 -sSf https://install.soroban.stellar.org | sh`
   - verify: `soroban --version`

3. Run local network:
   - `soroban dev` (or `soroban config set --global network rpc https://soroban-testnet.stellar.org`)

4. Build + deploy contract:
   - `cd contract`
   - `soroban contract build`
   - `soroban contract deploy --network testnet --wasm target/wasm32-unknown-unknown/release/contract.wasm`

5. Set contract ID in frontend:
   - `frontend/src/components/ContractHub.tsx` at `CONTRACT_ID`.

6. Run frontend:
   - `cd frontend`
   - `npm run dev`

## Push after changes

`git add -A && git commit -m "feat: high-fidelity UI and dashboard enhancements" && git push`
