import React, { useState } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { Contract, TransactionBuilder, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE'; // Placeholder, replace with actual deployed contract ID

export function ContractHub() {
  const { address, activeChain, server, activeConnector } = useSorobanReact();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [contractId, setContractId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [owner, setOwner] = useState('');
  const [externalAddress, setExternalAddress] = useState('');
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [searchCategory, setSearchCategory] = useState('');

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
    const idPattern = /^[a-zA-Z0-9]{1,64}$/;
    if (!idPattern.test(contractId)) {
      alert('Contract ID must be alphanumeric and 1 to 64 characters long.');
      return;
    }

    setLoading(true);
    try {
      const args = [contractId, title, description, category, owner || address];
      await callContract('register_contract', args);
      alert('Contract registered successfully!');
      setContractId('');
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

  const viewContract = async (id: string) => {
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

  const listAllContracts = async () => {
    if (!server || !address) return;
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: activeChain?.network,
    })
      .addOperation(contract.call('list_contract_ids'))
      .setTimeout(30)
      .build();

    // @ts-ignore
    const result = await server.simulateTransaction(tx);
    if ('result' in result && result.result) {
      // @ts-ignore
      const ids = scValToNative(result.result.retval);
      const contracts = [];
      for (const id of ids) {
        const contractData = await viewContract(id);
        if (contractData && contractData.reg_time !== 0) {
          contracts.push(contractData);
        }
      }
      setAllContracts(contracts);
    }
  };

  const registerExternalContract = async () => {
    const idPattern = /^[a-zA-Z0-9]{1,64}$/;
    if (!idPattern.test(contractId)) {
      alert('Contract ID must be alphanumeric and 1 to 64 characters long.');
      return;
    }

    setLoading(true);
    try {
      const args = [contractId, title, description, category, owner || address, externalAddress];
      await callContract('register_external_contract', args);
      alert('External contract registered successfully!');
      setContractId('');
      setTitle('');
      setDescription('');
      setCategory('');
      setOwner('');
      setExternalAddress('');
      loadStats();
      listAllContracts();
    } catch (error) {
      console.error(error);
      alert('Error registering external contract');
    }
    setLoading(false);
  };

  const searchContracts = async () => {
    if (!searchCategory) {
      listAllContracts();
      return;
    }
    const filtered = allContracts.filter(c => c.category.toLowerCase().includes(searchCategory.toLowerCase()));
    setAllContracts(filtered);
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
            <label htmlFor="contractId">Contract ID</label>
            <input
              id="contractId"
              type="text"
              placeholder="Alphanumeric ID (1-64 chars)"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              required
              maxLength={64}
            />
          </div>
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
        <h2>Register External Contract (Global Discovery)</h2>
        <form onSubmit={(e) => { e.preventDefault(); registerExternalContract(); }}>
          <div className="form-group">
            <label htmlFor="extContractId">Contract ID</label>
            <input
              id="extContractId"
              type="text"
              placeholder="Alphanumeric ID (1-64 chars)"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              required
              maxLength={64}
            />
          </div>
          <div className="form-group">
            <label htmlFor="extTitle">Title</label>
            <input
              id="extTitle"
              type="text"
              placeholder="Contract Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="extDescription">Description</label>
            <input
              id="extDescription"
              type="text"
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="extCategory">Category</label>
            <input
              id="extCategory"
              type="text"
              placeholder="e.g. DeFi, NFT, DAO"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="extOwner">Owner (optional)</label>
            <input
              id="extOwner"
              type="text"
              placeholder="Stellar address"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="externalAddress">External Contract Address</label>
            <input
              id="externalAddress"
              type="text"
              placeholder="External contract address"
              value={externalAddress}
              onChange={(e) => setExternalAddress(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register External Contract'}
          </button>
        </form>
      </section>

      <section>
        <h2>Browse All Contracts</h2>
        <div className="form-group">
          <label htmlFor="searchCategory">Search by Category</label>
          <input
            id="searchCategory"
            type="text"
            placeholder="Filter by category"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          />
          <button onClick={searchContracts}>Search</button>
          <button onClick={listAllContracts}>Load All</button>
        </div>
        <div className="contracts-list">
          {allContracts.map((contract, index) => (
            <div key={index} className="contract-item">
              <h4>{contract.title} (ID: {contract.id})</h4>
              <p><strong>Description:</strong> {contract.descrip}</p>
              <p><strong>Category:</strong> {contract.category}</p>
              <p><strong>Owner:</strong> {contract.owner}</p>
              {contract.external_address && <p><strong>External Address:</strong> {contract.external_address}</p>}
              <p><strong>Registration Time:</strong> {new Date(contract.reg_time * 1000).toLocaleString()}</p>
              <p><strong>Status:</strong> {contract.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}