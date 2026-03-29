import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import { ContractHub } from './components/ContractHub';
import { WalletConnector } from './components/WalletConnector';

const chains = [
  {
    id: 'testnet',
    name: 'Testnet',
    network: 'Test SDF Network ; September 2015',
    networkPassphrase: 'Test SDF Network ; September 2015',
    networkUrl: 'https://soroban-testnet.stellar.org',
  },
  {
    id: 'mainnet',
    name: 'Mainnet',
    network: 'Public Global Stellar Network ; September 2015',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    networkUrl: 'https://soroban-rpc.mainnet.stellar.gateway.fm',
  },
];

const connectors = [freighter()];

function App() {
  return (
    <SorobanReactProvider
      chains={chains}
      connectors={connectors}
      appName="Smart Contract Hub"
    >
      <div className="app">
        <h1>Smart Contract Hub</h1>
        <WalletConnector />
        <ContractHub />
      </div>
    </SorobanReactProvider>
  );
}

export default App;