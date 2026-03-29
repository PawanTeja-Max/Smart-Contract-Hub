# Smart Contract Hub

## Project Title
**Smart Contract Hub**

---

## Project Description

Smart Contract Hub is a decentralized on-chain registry built on the **Stellar blockchain** using the **Soroban SDK**. It allows developers and organizations to publish, discover, and manage smart contract entries in a transparent, tamper-resistant directory. Anyone can register a contract entry with a title, description, category, and owner identity. Administrators or owners can deactivate stale or deprecated entries, while the hub continuously tracks live statistics about all registered contracts.

---

## Project Vision

The vision of Smart Contract Hub is to become the go-to on-chain directory for the Stellar/Soroban ecosystem — a place where developers can showcase their contracts, users can discover trusted solutions by category, and the broader community can track ecosystem growth in real time. By keeping all metadata on-chain, the hub ensures that every listing is permanent, auditable, and free from centralized gatekeeping.

---

## Key Features

| Feature | Description |
|---|---|
| **On-chain Registration** | Register any smart contract with a title, description, category, and owner — all stored directly on the Stellar ledger. |
| **Unique Auto-ID Assignment** | Every registered contract receives a unique, auto-incremented ID for easy lookup and referencing. |
| **Category Tagging** | Contracts can be tagged by category (e.g. `DeFi`, `NFT`, `DAO`, `Gaming`) to enable organized discovery. |
| **Soft Deactivation** | Entries can be marked inactive (archived) without being deleted, preserving the full historical record on-chain. |
| **Live Hub Statistics** | The hub maintains real-time counters for total, active, and inactive contract entries via the `view_hub_stats` function. |
| **TTL Management** | Storage TTL is extended on every write operation to ensure persistent availability of entries on the ledger. |

---

## Future Scope

- **Search & Filtering** — Introduce category-based and keyword-based filtering functions so users can query subsets of the registry without reading every entry.
- **Upvoting / Reputation System** — Allow the community to upvote trustworthy contracts, creating a on-chain reputation layer.
- **Verified Ownership** — Integrate Stellar account signature verification so only the original deployer can update or deactivate their own listing.
- **Version Tracking** — Support multiple versions of the same contract project, allowing developers to publish upgrades while keeping older versions discoverable.
- **Cross-chain References** — Extend entries to include references to contract addresses on other chains (Ethereum, Solana, etc.), making the hub a multi-chain registry.
- **Frontend dApp** — Build a web UI that reads directly from this contract, giving non-technical users a clean interface to browse and submit entries.
- **Governance Module** — Introduce a DAO-style governance mechanism to let token holders vote on featured listings, category standards, and hub upgrade proposals.

---

## Contract Functions

### `register_contract(env, title, descrip, category, owner) -> u64`
Registers a new smart contract entry in the hub. Returns the unique auto-assigned ID.

### `view_contract(env, id) -> ContractEntry`
Fetches the full details of a registered contract by its unique ID. Returns default empty values if not found.

### `deactivate_contract(env, id)`
Marks an active entry as inactive (archived). Panics if the entry does not exist or is already inactive.

### `view_hub_stats(env) -> HubStats`
Returns global hub statistics: total registrations, active entries, and inactive entries.

---

## Data Structures

```rust
pub struct ContractEntry {
    pub id: u64,
    pub title: String,
    pub descrip: String,
    pub category: String,
    pub owner: String,
    pub reg_time: u64,
    pub is_active: bool,
}

pub struct HubStats {
    pub total: u64,
    pub active: u64,
    pub inactive: u64,
}
```

---

## Tech Stack

- **Blockchain:** Stellar
- **Smart Contract SDK:** [Soroban SDK](https://soroban.stellar.org/)
- **Language:** Rust (`no_std`)

---

> Built with ❤️ on Stellar · Powered by Soroban

---

## Deployed Contract

Contract ID:

`CA2R3BJOQP2EGR5NGIZVQQNF6EQYONUGAMR2LVVDQSAKG7WKPMUEEBPG`

## Contract on-chain status

![Smart Contract Hub on Stellar Explorer](https://user-images.githubusercontent.com/0/placeholder.png)

*Screenshot of deployed contract summary with contract address and status.*
