#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, symbol_short, Vec};


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

// Symbol key for list of all contract IDs
const ALL_IDS: Symbol = symbol_short!("ALL_IDS");

// Maps a string-based contract ID to its ContractEntry
#[contracttype]
pub enum ContractBook {
    Entry(String),
}


// Represents a registered smart contract entry in the hub
#[contracttype]
#[derive(Clone)]
pub struct ContractEntry {
    pub id: String,        // Unique user-supplied identifier
    pub title: String,     // Short name of the contract
    pub descrip: String,   // Brief description of what the contract does
    pub category: String,  // Category tag (e.g. "DeFi", "NFT", "DAO")
    pub owner: String,     // Stellar address or alias of the submitter
    pub reg_time: u64,     // Ledger timestamp at registration
    pub is_active: bool,   // Whether the entry is currently active
    pub external_address: Option<String>, // Optional external contract address for global discovery
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
        id: String,
        title: String,
        descrip: String,
        category: String,
        owner: String,
    ) -> String {
        // validate id: 1-64 alphanumeric
        let id_len = id.len();
        if id_len == 0 || id_len > 64 {
            panic!("Contract ID must be 1 to 64 characters long");
        }
        for byte in id.to_bytes() {
            let is_alnum = (byte >= b'0' && byte <= b'9') || (byte >= b'A' && byte <= b'Z') || (byte >= b'a' && byte <= b'z');
            if !is_alnum {
                panic!("Contract ID must be alphanumeric");
            }
        }

        // Ensure unique ID
        if env.storage().instance().has(&ContractBook::Entry(id.clone())) {
            panic!("Contract ID already exists");
        }

        let time = env.ledger().timestamp();

        // Build the new entry
        let entry = ContractEntry {
            id: id.clone(),
            title,
            descrip,
            category,
            owner,
            reg_time: time,
            is_active: true,
            external_address: None, // Internal contract
        };

        // Persist the entry
        env.storage()
            .instance()
            .set(&ContractBook::Entry(id.clone()), &entry);

        // Add to all IDs list
        let mut all_ids: Vec<String> = env.storage().instance().get(&ALL_IDS).unwrap_or(Vec::new(&env));
        all_ids.push_back(id.clone());
        env.storage().instance().set(&ALL_IDS, &all_ids);

        // Update hub-wide stats
        let mut stats = Self::view_hub_stats(env.clone());
        stats.total += 1;
        stats.active += 1;
        env.storage().instance().set(&HUB_STATS, &stats);

        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Contract registered with ID: {}", id);
        id
    }


    // ─── FUNCTION 2 ───────────────────────────────────────────────────────────
    // Returns the ContractEntry for a given ID.
    // If no entry exists for that ID, default/empty values are returned.
    pub fn view_contract(env: Env, id: String) -> ContractEntry {
        env.storage()
            .instance()
            .get(&ContractBook::Entry(id.clone()))
            .unwrap_or(ContractEntry {
                id,
                title: String::from_str(&env, "Not_Found"),
                descrip: String::from_str(&env, "Not_Found"),
                category: String::from_str(&env, "Not_Found"),
                owner: String::from_str(&env, "Not_Found"),
                reg_time: 0,
                is_active: false,
                external_address: None,
            })
    }


    // ─── FUNCTION 3 ───────────────────────────────────────────────────────────
    // Marks an existing active contract entry as inactive (soft-delete / archive).
    // Only callable when the entry exists and is currently active.
    pub fn deactivate_contract(env: Env, id: String) {
        let mut entry = Self::view_contract(env.clone(), id.clone());

        if entry.reg_time == 0 {
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
            .set(&ContractBook::Entry(id.clone()), &entry);

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


    // ─── FUNCTION 5 ───────────────────────────────────────────────────────────
    // Returns a list of all registered contract IDs for browsing.
    pub fn list_contract_ids(env: Env) -> Vec<String> {
        env.storage()
            .instance()
            .get(&ALL_IDS)
            .unwrap_or(Vec::new(&env))
    }


    // ─── FUNCTION 6 ───────────────────────────────────────────────────────────
    // Registers an external contract (from outside this hub) for global discovery.
    pub fn register_external_contract(
        env: Env,
        id: String,
        title: String,
        descrip: String,
        category: String,
        owner: String,
        external_address: String,
    ) -> String {
        // validate id: 1-64 alphanumeric
        let id_len = id.len();
        if id_len == 0 || id_len > 64 {
            panic!("Contract ID must be 1 to 64 characters long");
        }
        for byte in id.to_bytes() {
            let is_alnum = (byte >= b'0' && byte <= b'9') || (byte >= b'A' && byte <= b'Z') || (byte >= b'a' && byte <= b'z');
            if !is_alnum {
                panic!("Contract ID must be alphanumeric");
            }
        }

        // Ensure unique ID
        if env.storage().instance().has(&ContractBook::Entry(id.clone())) {
            panic!("Contract ID already exists");
        }

        let time = env.ledger().timestamp();

        // Build the new entry
        let entry = ContractEntry {
            id: id.clone(),
            title,
            descrip,
            category,
            owner,
            reg_time: time,
            is_active: true,
            external_address: Some(external_address),
        };

        // Persist the entry
        env.storage()
            .instance()
            .set(&ContractBook::Entry(id.clone()), &entry);

        // Add to all IDs list
        let mut all_ids: Vec<String> = env.storage().instance().get(&ALL_IDS).unwrap_or(Vec::new(&env));
        all_ids.push_back(id.clone());
        env.storage().instance().set(&ALL_IDS, &all_ids);

        // Update hub-wide stats
        let mut stats = Self::view_hub_stats(env.clone());
        stats.total += 1;
        stats.active += 1;
        env.storage().instance().set(&HUB_STATS, &stats);

        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "External contract registered with ID: {}", id);
        id
    }
}