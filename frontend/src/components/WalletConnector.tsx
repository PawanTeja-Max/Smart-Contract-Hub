import { useSorobanReact } from '@soroban-react/core';

export function WalletConnector() {
  const { address, connect, disconnect } = useSorobanReact();

  if (address) {
    return (
      <div className="wallet-connector">
        <p>Connected: {address}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div className="wallet-connector">
      <button onClick={() => connect()}>Connect Wallet</button>
    </div>
  );
}