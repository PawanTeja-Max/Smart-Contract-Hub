#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, symbol_short};


// Tracks overall hub statistics
#[contracttype]
#[derive(Clone)]
pub struct HubStats {
    pub total: u64,    // Total contracts registered
    pub active: u64,   // Contracts currently active
    pub inactive: u64, // Contracts marked inactive
}


// Symbol key for HubStats in instance storage
const HUB_STATS: Symbol = symbol_short!("HUB_STATS");

// Counter key for auto-incrementing contract IDs
const COUNT_CTR: Symbol = symbol_short!("COUNT_CTR");


// Maps a numeric ID to its ContractEntry
#[contracttype]
pub enum ContractBook {
    Entry(u64),
}


// Represents a registered smart contract entry in the hub
#[contracttype]
#[derive(Clone)]
pub struct ContractEntry {
    pub id: u64,           // Unique auto-assigned identifier
    pub title: String,     // Short name of the contract
    pub descrip: String,   // Brief description of what the contract does
    pub category: String,  // Category tag (e.g. "DeFi", "NFT", "DAO")
    pub owner: String,     // Stellar address or alias of the submitter
    pub reg_time: u64,     // Ledger timestamp at registration
    pub is_active: bool,   // Whether the entry is currently active
}


#[contract]
pub struct SmartContractHub;


#[contractimpl]
impl SmartContractHub {

    // ─── FUNCTION 1 ───────────────────────────────────────────────────────────
    // Registers a new smart contract entry in the hub.
    // Returns the unique ID assigned to the newly registered entry.
    pub fn register_contract(
        env: Env,
        title: String,
        descrip: String,
        category: String,
        owner: String,
    ) -> u64 {
        // Fetch and increment the global counter
        let mut count: u64 = env.storage().instance().get(&COUNT_CTR).unwrap_or(0);
        count += 1;

        let time = env.ledger().timestamp();

        // Build the new entry
        let entry = ContractEntry {
            id: count,
            title,
            descrip,
            category,
            owner,
            reg_time: time,
            is_active: true,
        };

        // Persist the entry
        env.storage()
            .instance()
            .set(&ContractBook::Entry(count), &entry);

        // Update hub-wide stats
        let mut stats = Self::view_hub_stats(env.clone());
        stats.total += 1;
        stats.active += 1;
        env.storage().instance().set(&HUB_STATS, &stats);

        // Save new counter value and extend TTL
        env.storage().instance().set(&COUNT_CTR, &count);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Contract registered with ID: {}", count);
        count
    }


    // ─── FUNCTION 2 ───────────────────────────────────────────────────────────
    // Returns the ContractEntry for a given ID.
    // If no entry exists for that ID, default/empty values are returned.
    pub fn view_contract(env: Env, id: u64) -> ContractEntry {
        env.storage()
            .instance()
            .get(&ContractBook::Entry(id))
            .unwrap_or(ContractEntry {
                id: 0,
                title: String::from_str(&env, "Not_Found"),
                descrip: String::from_str(&env, "Not_Found"),
                category: String::from_str(&env, "Not_Found"),
                owner: String::from_str(&env, "Not_Found"),
                reg_time: 0,
                is_active: false,
            })
    }


    // ─── FUNCTION 3 ───────────────────────────────────────────────────────────
    // Marks an existing active contract entry as inactive (soft-delete / archive).
    // Only callable when the entry exists and is currently active.
    pub fn deactivate_contract(env: Env, id: u64) {
        let mut entry = Self::view_contract(env.clone(), id);

        if entry.id == 0 {
            log!(&env, "Entry not found for ID: {}", id);
            panic!("Entry not found");
        }

        if !entry.is_active {
            log!(&env, "Entry ID: {} is already inactive", id);
            panic!("Entry is already inactive");
        }

        entry.is_active = false;

        // Persist updated entry
        env.storage()
            .instance()
            .set(&ContractBook::Entry(id), &entry);

        // Update hub-wide stats
        let mut stats = Self::view_hub_stats(env.clone());
        stats.active -= 1;
        stats.inactive += 1;
        env.storage().instance().set(&HUB_STATS, &stats);

        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Entry ID: {} has been deactivated", id);
    }


    // ─── FUNCTION 4 ───────────────────────────────────────────────────────────
    // Returns the global HubStats (total, active, inactive counts).
    pub fn view_hub_stats(env: Env) -> HubStats {
        env.storage()
            .instance()
            .get(&HUB_STATS)
            .unwrap_or(HubStats {
                total: 0,
                active: 0,
                inactive: 0,
            })
    }
}