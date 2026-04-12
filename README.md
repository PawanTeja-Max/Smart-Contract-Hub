# Smart Contract Hub

## Project Title
**Smart Contract Hub**

---

## Project Description

Smart Contract Hub is a decentralized on-chain registry built on the **Stellar blockchain** using the **Soroban SDK**. It allows developers and organizations to publish, discover, and manage smart contract entries in a transparent, tamper-resistant directory. Anyone can register a contract entry with a title, description, category, and owner identity. Owners can deactivate their own entries via on-chain signature verification, while the hub continuously tracks live statistics and supports community-driven upvoting. Social links (GitHub, website, docs) help users discover project resources at a glance.

---

## Project Vision

The vision of Smart Contract Hub is to become the go-to on-chain directory for the Stellar/Soroban ecosystem — a place where developers can showcase their contracts, users can discover trusted solutions by category, and the broader community can track ecosystem growth in real time. By keeping all metadata on-chain, the hub ensures that every listing is permanent, auditable, and free from centralized gatekeeping.

---

## Key Features

| Feature | Description |
|---|---|
| **On-chain Registration** | Register any smart contract with a title, description, category, owner, and optional social links — all stored directly on the Stellar ledger. |
| **Unique ID Assignment** | Every registered contract receives a unique, user-supplied alphanumeric ID for easy lookup and referencing. |
| **Category Tagging** | Contracts can be tagged by category (e.g. `DeFi`, `NFT`, `DAO`, `Gaming`) with visual category icons in the frontend. |
| **Soft Deactivation** | Entries can be marked inactive (archived) without being deleted, preserving the full historical record on-chain. |
| **Ownership Verification** | Only the original owner can deactivate their contract entry, enforced via `require_auth()` on-chain signature verification. |
| **Community Upvoting** | Users can upvote active contracts, creating a community-driven reputation and discovery system. |
| **Soroban Events** | Events are emitted on registration, deactivation, and upvoting, enabling real-time tracking by external indexers. |
| **Social Links** | Each entry can include optional GitHub repository URL, project website, and documentation link. |
| **Deep Linking** | Share direct links to specific contract entries via URL hash routing (e.g. `#/contract/MY_TOKEN`). |
| **Live Hub Statistics** | The hub maintains real-time counters for total, active, and inactive contract entries via the `view_hub_stats` function. |
| **TTL Management** | Storage TTL is extended on every write operation to ensure persistent availability of entries on the ledger. |

---

## Contract Functions

### `register_contract(env, id, title, descrip, category, owner, github_url?, website?, docs_url?) -> String`
Registers a new smart contract entry in the hub with optional social links. Returns the unique ID.
- **Event emitted:** `("register", id)`

### `register_external_contract(env, id, title, descrip, category, owner, external_address, github_url?, website?, docs_url?) -> String`
Registers an external contract (from outside this hub) for global discovery, with an external address and optional social links.
- **Event emitted:** `("ext_reg", id)`

### `view_contract(env, id) -> ContractEntry`
Fetches the full details of a registered contract by its unique ID. Returns default empty values if not found.

### `deactivate_contract(env, id, owner: Address)`
Marks an active entry as inactive (archived). Requires the `owner` to authenticate via `require_auth()`. Panics if the entry does not exist, is already inactive, or the caller is not the owner.
- **Event emitted:** `("deactiv8", id)`

### `view_hub_stats(env) -> HubStats`
Returns global hub statistics: total registrations, active entries, and inactive entries.

### `list_contract_ids(env) -> Vec<String>`
Returns a list of all registered contract IDs for browsing.

### `upvote_contract(env, id) -> u64`
Upvotes an active contract entry. Increments the vote counter and returns the new total. Panics if the entry does not exist or is inactive.
- **Event emitted:** `("upvote", id)`

---

## Events

The contract emits Soroban events for key actions, allowing external indexers and dApps to subscribe to real-time activity:

| Event Topic | Payload | Trigger |
|---|---|---|
| `("register", id)` | Contract ID (String) | When a new internal contract is registered |
| `("ext_reg", id)` | Contract ID (String) | When a new external contract is registered |
| `("deactiv8", id)` | Contract ID (String) | When a contract entry is deactivated |
| `("upvote", id)` | Vote count (u64) | When a contract entry is upvoted |

---

## Data Structures

```rust
pub struct ContractEntry {
    pub id: String,
    pub title: String,
    pub descrip: String,
    pub category: String,
    pub owner: String,
    pub reg_time: u64,
    pub is_active: bool,
    pub external_address: Option<String>,
    pub votes: u64,
    pub github_url: Option<String>,
    pub website: Option<String>,
    pub docs_url: Option<String>,
}

pub struct HubStats {
    pub total: u64,
    pub active: u64,
    pub inactive: u64,
}
```

---

## Frontend Features

- **Category Icons** — Visual SVG icons for known categories (DeFi, NFT, DAO, Gaming, Utility)
- **Deep Linking** — Hash-based routing (`#/contract/ID`) with a detail modal and shareable URLs
- **Upvote UI** — One-click upvote button on every contract card
- **Social Links** — Clickable GitHub, Website, and Docs icons on each contract card
- **Share Button** — Copy a direct link to any contract entry to the clipboard

---

## Tech Stack

- **Blockchain:** Stellar
- **Smart Contract SDK:** [Soroban SDK](https://soroban.stellar.org/)
- **Language:** Rust (`no_std`)
- **Frontend:** React + TypeScript + Vite
- **Wallet:** Freighter (via `@soroban-react`)

---

> Built with ❤️ on Stellar · Powered by Soroban

---

## Future Scope

- ~~**Upvoting / Reputation System**~~ ✅ Implemented
- ~~**Verified Ownership**~~ ✅ Implemented via `require_auth()`
- **Search & Filtering** — Introduce category-based and keyword-based filtering functions so users can query subsets of the registry without reading every entry.
- **Version Tracking** — Support multiple versions of the same contract project, allowing developers to publish upgrades while keeping older versions discoverable.
- **Cross-chain References** — Extend entries to include references to contract addresses on other chains (Ethereum, Solana, etc.), making the hub a multi-chain registry.
- **Governance Module** — Introduce a DAO-style governance mechanism to let token holders vote on featured listings, category standards, and hub upgrade proposals.

---

## Deployed Contract

Contract ID:

`CA2R3BJOQP2EGR5NGIZVQQNF6EQYONUGAMR2LVVDQSAKG7WKPMUEEBPG`

## Contract on-chain status

![Smart Contract Hub on Stellar Explorer](https://user-images.githubusercontent.com/0/placeholder.png)

*Screenshot of deployed contract summary with contract address and status.*
