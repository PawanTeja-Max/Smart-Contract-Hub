# Smart Contract Hub Frontend

A React frontend for interacting with the Smart Contract Hub Soroban contract.

## Features

- Connect to Stellar wallet (Freighter)
- Register new smart contracts
- View contract details
- Deactivate contracts
- View hub statistics

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update the contract ID in `src/components/ContractHub.tsx` with your deployed contract ID.

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Connect your Freighter wallet.
2. Register a new contract by filling the form.
3. View statistics and contract details.

## Backend Integration

The frontend integrates with the Soroban contract deployed on Stellar network. It uses Soroban React for wallet connection and transaction handling.