#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_registration() {
    let env = Env::default();
    let contract_id = env.register(SmartContractHub, ());
    let client = SmartContractHubClient::new(&env, &contract_id);

    let owner_addr = Address::generate(&env);

    let id = String::from_str(&env, "TestID");
    let title = String::from_str(&env, "Test Title");
    let desc = String::from_str(&env, "Test Description");
    let cat = String::from_str(&env, "DeFi");
    let owner = owner_addr.to_string();
    let github = Some(String::from_str(&env, "https://github.com/test"));
    let website = Some(String::from_str(&env, "https://test.com"));
    let docs = Some(String::from_str(&env, "https://docs.test.com"));

    client.register_contract(&id, &title, &desc, &cat, &owner, &github, &website, &docs);

    let entry = client.view_contract(&id);
    assert_eq!(entry.id, id);
    assert_eq!(entry.title, title);
    assert_eq!(entry.is_active, true);
    assert_eq!(entry.votes, 0);
    assert_eq!(entry.github_url, github);
    assert_eq!(entry.website, website);
    assert_eq!(entry.docs_url, docs);

    let stats = client.view_hub_stats();
    assert_eq!(stats.total, 1);
    assert_eq!(stats.active, 1);
}

#[test]
fn test_upvote() {
    let env = Env::default();
    let contract_id = env.register(SmartContractHub, ());
    let client = SmartContractHubClient::new(&env, &contract_id);

    let id = String::from_str(&env, "UpvoteTest");
    let title = String::from_str(&env, "Upvote Contract");
    let desc = String::from_str(&env, "Testing upvotes");
    let cat = String::from_str(&env, "DeFi");
    let owner = String::from_str(&env, "OwnerAddr");
    let none: Option<String> = None;

    client.register_contract(&id, &title, &desc, &cat, &owner, &none, &none, &none);

    let votes = client.upvote_contract(&id);
    assert_eq!(votes, 1);

    let votes2 = client.upvote_contract(&id);
    assert_eq!(votes2, 2);

    let entry = client.view_contract(&id);
    assert_eq!(entry.votes, 2);
}

#[test]
fn test_deactivation_auth() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SmartContractHub, ());
    let client = SmartContractHubClient::new(&env, &contract_id);

    let owner_addr = Address::generate(&env);
    let owner_str = owner_addr.to_string();

    let id = String::from_str(&env, "DeactTest");
    let title = String::from_str(&env, "Deact Contract");
    let desc = String::from_str(&env, "Testing deactivation");
    let cat = String::from_str(&env, "DAO");
    let none: Option<String> = None;

    client.register_contract(&id, &title, &desc, &cat, &owner_str, &none, &none, &none);

    // Deactivate with the correct owner
    client.deactivate_contract(&id, &owner_addr);

    let entry = client.view_contract(&id);
    assert_eq!(entry.is_active, false);

    let stats = client.view_hub_stats();
    assert_eq!(stats.active, 0);
    assert_eq!(stats.inactive, 1);
}

#[test]
fn test_external_contract() {
    let env = Env::default();
    let contract_id = env.register(SmartContractHub, ());
    let client = SmartContractHubClient::new(&env, &contract_id);

    let id = String::from_str(&env, "ExtTest");
    let title = String::from_str(&env, "External Contract");
    let desc = String::from_str(&env, "An external contract");
    let cat = String::from_str(&env, "NFT");
    let owner = String::from_str(&env, "OwnerAddr");
    let ext_addr = String::from_str(&env, "GABCDEF1234567890");
    let github = Some(String::from_str(&env, "https://github.com/ext"));
    let none: Option<String> = None;

    client.register_external_contract(&id, &title, &desc, &cat, &owner, &ext_addr, &github, &none, &none);

    let entry = client.view_contract(&id);
    assert_eq!(entry.id, id);
    assert_eq!(entry.external_address, Some(ext_addr));
    assert_eq!(entry.github_url, github);

    let ids = client.list_contract_ids();
    assert_eq!(ids.len(), 1);
}
