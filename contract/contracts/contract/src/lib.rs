#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, symbol_short, Vec, Address};


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
    pub votes: u64,                       // Community upvote counter
    pub github_url: Option<String>,       // Optional GitHub repository URL
    pub website: Option<String>,          // Optional project website URL
    pub docs_url: Option<String>,         // Optional documentation URL
}


#[contract]
pub struct SmartContractHub;


#[contractimpl]
impl SmartContractHub {

    // ─── HELPER ─────────────────────────────────────────────────────────────────
    // Validates contract ID format and length, panics on invalid values.
    fn validate_contract_id(id: &String) {
        let id_len = id.len();
        if id_len == 0 || id_len > 64 {
            panic!("Contract ID must be 1 to 64 characters long");
        }

        for byte in id.to_bytes() {
            let is_alnum =
                (byte >= b'0' && byte <= b'9') ||
                (byte >= b'A' && byte <= b'Z') ||
                (byte >= b'a' && byte <= b'z');
            if !is_alnum {
                panic!("Contract ID must be alphanumeric");
            }
        }
    }

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
        github_url: Option<String>,
        website: Option<String>,
        docs_url: Option<String>,
    ) -> String {
        Self::validate_contract_id(&id);

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
            votes: 0,
            github_url,
            website,
            docs_url,
        };

        // Persist the entry
        env.storage()
            .instance()
            .set(&ContractBook::Entry(id.clone()), &entry);

        // Add to all IDs list safely (avoid MissingValue host error)
        let mut all_ids: Vec<String> = Self::safe_all_ids(&env);
        all_ids.push_back(id.clone());
        env.storage().instance().set(&ALL_IDS, &all_ids);

        // Update hub-wide stats
        let mut stats = Self::safe_hub_stats(&env);
        stats.total += 1;
        stats.active += 1;
        env.storage().instance().set(&HUB_STATS, &stats);

        env.storage().instance().extend_ttl(5000, 5000);

        // Emit registration event
        env.events().publish(
            (symbol_short!("register"), id.clone()),
            id.clone(),
        );

        log!(&env, "Contract registered with ID: {}", id);
        id
    }


    // ─── FUNCTION 2 ───────────────────────────────────────────────────────────
    // Returns the ContractEntry for a given ID.
    // If no entry exists for that ID, default/empty values are returned.
    pub fn view_contract(env: Env, id: String) -> ContractEntry {
        if env.storage().instance().has(&ContractBook::Entry(id.clone())) {
            env.storage().instance().get(&ContractBook::Entry(id.clone())).unwrap()
        } else {
            ContractEntry {
                id,
                title: String::from_str(&env, "Not_Found"),
                descrip: String::from_str(&env, "Not_Found"),
                category: String::from_str(&env, "Not_Found"),
                owner: String::from_str(&env, "Not_Found"),
                reg_time: 0,
                is_active: false,
                external_address: None,
                votes: 0,
                github_url: None,
                website: None,
                docs_url: None,
            }
        }
    }


    // ─── FUNCTION 3 ───────────────────────────────────────────────────────────
    // Marks an existing active contract entry as inactive (soft-delete / archive).
    // Requires the owner to authenticate via require_auth().
    pub fn deactivate_contract(env: Env, id: String, owner: Address) {
        // Require the caller to authenticate as the owner
        owner.require_auth();

        let key = ContractBook::Entry(id.clone());
        if !env.storage().instance().has(&key) {
            log!(&env, "Entry not found for ID: {}", id);
            panic!("Entry not found");
        }
        
        let mut entry: ContractEntry = env.storage().instance().get(&key).unwrap();

        // Verify that the caller matches the stored owner
        let caller_str = owner.to_string();
        if caller_str != entry.owner {
            log!(&env, "Unauthorized: caller does not match entry owner for ID: {}", id);
            panic!("Unauthorized: caller is not the owner");
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

        // Emit deactivation event
        env.events().publish(
            (symbol_short!("deactiv8"), id.clone()),
            id.clone(),
        );

        log!(&env, "Entry ID: {} has been deactivated", id);
    }


    // ─── HELPER ─────────────────────────────────────────────────────────────────
    // Safely returns hub stats, initializing to defaults when missing.
    fn safe_hub_stats(env: &Env) -> HubStats {
        if env.storage().instance().has(&HUB_STATS) {
            env.storage().instance().get(&HUB_STATS).unwrap()
        } else {
            HubStats {
                total: 0,
                active: 0,
                inactive: 0,
            }
        }
    }

    // ─── HELPER ─────────────────────────────────────────────────────────────────
    // Safely returns all IDs list, initializing to empty when missing.
    fn safe_all_ids(env: &Env) -> Vec<String> {
        if env.storage().instance().has(&ALL_IDS) {
            env.storage().instance().get(&ALL_IDS).unwrap()
        } else {
            Vec::new(env)
        }
    }

    // ─── FUNCTION 4 ───────────────────────────────────────────────────────────
    // Returns the global HubStats (total, active, inactive counts).
    pub fn view_hub_stats(env: Env) -> HubStats {
        Self::safe_hub_stats(&env)
    }


    // ─── FUNCTION 5 ───────────────────────────────────────────────────────────
    // Returns a list of all registered contract IDs for browsing.
    pub fn list_contract_ids(env: Env) -> Vec<String> {
        Self::safe_all_ids(&env)
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
        github_url: Option<String>,
        website: Option<String>,
        docs_url: Option<String>,
    ) -> String {
        Self::validate_contract_id(&id);

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
            votes: 0,
            github_url,
            website,
            docs_url,
        };

        // Persist the entry
        env.storage()
            .instance()
            .set(&ContractBook::Entry(id.clone()), &entry);

        // Add to all IDs list safely (avoid MissingValue host error)
        let mut all_ids: Vec<String> = Self::safe_all_ids(&env);
        all_ids.push_back(id.clone());
        env.storage().instance().set(&ALL_IDS, &all_ids);

        // Update hub-wide stats
        let mut stats = Self::safe_hub_stats(&env);
        stats.total += 1;
        stats.active += 1;
        env.storage().instance().set(&HUB_STATS, &stats);

        env.storage().instance().extend_ttl(5000, 5000);

        // Emit external registration event
        env.events().publish(
            (symbol_short!("ext_reg"), id.clone()),
            id.clone(),
        );

        log!(&env, "External contract registered with ID: {}", id);
        id
    }


    // ─── FUNCTION 7 ───────────────────────────────────────────────────────────
    // Upvotes a registered contract entry. Increments the vote counter by 1.
    // Panics if the entry does not exist or is inactive.
    pub fn upvote_contract(env: Env, id: String) -> u64 {
        let key = ContractBook::Entry(id.clone());
        if !env.storage().instance().has(&key) {
            log!(&env, "Entry not found for ID: {}", id);
            panic!("Entry not found");
        }
        
        let mut entry: ContractEntry = env.storage().instance().get(&key).unwrap();

        if !entry.is_active {
            log!(&env, "Cannot upvote inactive entry ID: {}", id);
            panic!("Cannot upvote an inactive contract");
        }

        entry.votes += 1;

        // Persist updated entry
        env.storage()
            .instance()
            .set(&ContractBook::Entry(id.clone()), &entry);

        env.storage().instance().extend_ttl(5000, 5000);

        // Emit upvote event
        env.events().publish(
            (symbol_short!("upvote"), id.clone()),
            entry.votes,
        );

        log!(&env, "Entry ID: {} upvoted. Total votes: {}", id, entry.votes);
        entry.votes
    }
}

#[cfg(test)]
mod test;