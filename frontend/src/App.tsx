import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import { testnet, mainnet } from '@soroban-react/chains';
import { ContractHub } from './components/ContractHub';
import { WalletConnector } from './components/WalletConnector';

const chains = [testnet, mainnet];

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