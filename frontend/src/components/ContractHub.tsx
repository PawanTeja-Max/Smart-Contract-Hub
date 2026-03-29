import React, { useState } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { Contract, TransactionBuilder, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE'; // Placeholder, replace with actual deployed contract ID

export function ContractHub() {
  const { address, activeChain, server, activeConnector } = useSorobanReact();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [viewId, setViewId] = useState('');
  const [viewedContract, setViewedContract] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [owner, setOwner] = useState('');

  const contract = new Contract(CONTRACT_ID);

  const callContract = async (method: string, args: any[] = []) => {
    if (!server || !address || !activeConnector) return null;
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: activeChain?.network,
    })
      .addOperation(contract.call(method, ...args.map(arg => nativeToScVal(arg))))
      .setTimeout(30)
      .build();

    // @ts-ignore
    const preparedTx = await server.prepareTransaction(tx);
    const signedXDR = await activeConnector.signTransaction(preparedTx.toXDR(), {
      networkPassphrase: activeChain?.network,
    });
    // @ts-ignore
    const signedTx = TransactionBuilder.fromXDR(signedXDR, activeChain?.network);
    // @ts-ignore
    const result = await server.sendTransaction(signedTx);
    return result;
  };

  const registerContract = async () => {
    setLoading(true);
    try {
      const args = [title, description, category, owner || address];
      await callContract('register_contract', args);
      alert('Contract registered successfully!');
      setTitle('');
      setDescription('');
      setCategory('');
      setOwner('');
      loadStats();
    } catch (error) {
      console.error(error);
      alert('Error registering contract');
    }
    setLoading(false);
  };

  const viewContract = async (id: number) => {
    if (!server || !address) return null;
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: activeChain?.network,
    })
      .addOperation(contract.call('view_contract', nativeToScVal(id)))
      .setTimeout(30)
      .build();

    // @ts-ignore
    const result = await server.simulateTransaction(tx);
    if ('result' in result && result.result) {
      // @ts-ignore
      return scValToNative(result.result.retval);
    }
    return null;
  };

  const viewStats = async () => {
    if (!server || !address) return null;
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: activeChain?.network,
    })
      .addOperation(contract.call('view_hub_stats'))
      .setTimeout(30)
      .build();

    // @ts-ignore
    const result = await server.simulateTransaction(tx);
    if ('result' in result && result.result) {
      // @ts-ignore
      return scValToNative(result.result.retval);
    }
    return null;
  };

  const loadStats = async () => {
    const stats = await viewStats();
    setStats(stats);
  };

  const handleViewContract = async () => {
    if (!viewId) return;
    const id = parseInt(viewId);
    if (isNaN(id)) return;
    const contract = await viewContract(id);
    setViewedContract(contract);
  };

  React.useEffect(() => {
    if (address) {
      loadStats();
    }
  }, [address]);

  if (!address) {
    return <div className="wallet-connector">Please connect your wallet to continue.</div>;
  }

  return (
    <div>
      <section>
        <h2>Hub Statistics</h2>
        {stats ? (
          <div className="stats">
            <div className="stat-card">
              <h3>{stats.total}</h3>
              <p>Total Contracts</p>
            </div>
            <div className="stat-card">
              <h3>{stats.active}</h3>
              <p>Active Contracts</p>
            </div>
            <div className="stat-card">
              <h3>{stats.inactive}</h3>
              <p>Inactive Contracts</p>
            </div>
          </div>
        ) : (
          <p>Loading statistics...</p>
        )}
      </section>

      <section>
        <h2>Register New Contract</h2>
        <form onSubmit={(e) => { e.preventDefault(); registerContract(); }}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Contract Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              placeholder="e.g. DeFi, NFT, DAO"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="owner">Owner (optional)</label>
            <input
              id="owner"
              type="text"
              placeholder="Stellar address"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register Contract'}
          </button>
        </form>
      </section>

      <section>
        <h2>View Contract</h2>
        <div className="form-group">
          <label htmlFor="viewId">Contract ID</label>
          <input
            id="viewId"
            type="number"
            placeholder="Enter contract ID"
            value={viewId}
            onChange={(e) => setViewId(e.target.value)}
          />
          <button onClick={handleViewContract} disabled={!viewId}>View Contract</button>
        </div>
        {viewedContract && viewedContract.id !== 0 && (
          <div className="contract-item">
            <h4>{viewedContract.title}</h4>
            <p><strong>Description:</strong> {viewedContract.descrip}</p>
            <p><strong>Category:</strong> {viewedContract.category}</p>
            <p><strong>Owner:</strong> {viewedContract.owner}</p>
            <p><strong>Registration Time:</strong> {new Date(viewedContract.reg_time * 1000).toLocaleString()}</p>
            <p><strong>Status:</strong> {viewedContract.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        )}
        {viewedContract && viewedContract.id === 0 && (
          <p>Contract not found.</p>
        )}
      </section>
    </div>
  );
}