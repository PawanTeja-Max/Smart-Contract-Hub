import React, { useState } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { Contract, TransactionBuilder, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';

export function ContractHub() {
  const { address, activeChain, server, activeConnector } = useSorobanReact();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
      networkPassphrase: activeChain?.networkPassphrase || 'Standalone Network ; February 2017',
    })
      .addOperation(contract.call(method, ...args.map((arg) => nativeToScVal(arg))))
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    const signedXDR = await activeConnector.signTransaction(preparedTx.toXDR(), {
      networkPassphrase: activeChain?.networkPassphrase || 'Standalone Network ; February 2017',
    });
    const signedTx = TransactionBuilder.fromXDR(signedXDR, activeChain?.networkPassphrase);
    const result = await server.sendTransaction(signedTx);
    return result;
  };

  const validateContractId = (id: string) => {
    const idPattern = /^[a-zA-Z0-9]{1,64}$/;
    if (!idPattern.test(id)) {
      throw new Error('Contract ID must be alphanumeric and 1 to 64 characters long.');
    }
  };

  const registerContract = async () => {
    try {
      validateContractId(contractId);
    } catch (error: any) {
      alert(error.message);
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
      listAllContracts();
    } catch (error) {
      console.error(error);
      alert('Error registering contract');
    }
    setLoading(false);
  };

  const registerExternalContract = async () => {
    try {
      validateContractId(contractId);
    } catch (error: any) {
      alert(error.message);
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

  const viewContract = async (id: string) => {
    if (!server || !address) return null;
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: activeChain?.networkPassphrase || 'Standalone Network ; February 2017',
    })
      .addOperation(contract.call('view_contract', nativeToScVal(id)))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if ('result' in result && result.result) {
      return scValToNative(result.result.retval);
    }
    return null;
  };

  const viewStats = async () => {
    if (!server || !address) return null;
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: activeChain?.networkPassphrase || 'Standalone Network ; February 2017',
    })
      .addOperation(contract.call('view_hub_stats'))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if ('result' in result && result.result) {
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
      networkPassphrase: activeChain?.networkPassphrase || 'Standalone Network ; February 2017',
    })
      .addOperation(contract.call('list_contract_ids'))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if ('result' in result && result.result) {
      const ids = scValToNative(result.result.retval) as string[];
      const contracts: any[] = [];
      for (const id of ids) {
        const contractData = await viewContract(id);
        if (contractData && contractData.reg_time !== 0) {
          contracts.push(contractData);
        }
      }
      setAllContracts(contracts);
    }
  };

  const searchContracts = async () => {
    if (!searchCategory) {
      await listAllContracts();
      return;
    }
    const filtered = allContracts.filter((c) => c.category.toLowerCase().includes(searchCategory.toLowerCase()));
    setAllContracts(filtered);
  };

  React.useEffect(() => {
    if (address) {
      loadStats();
      listAllContracts();
    }
  }, [address]);

  const statusBadge = (status: any) => {
    const label = status.is_active ? 'Active' : 'Inactive';
    const theme = status.is_active ? 'active' : 'inactive';
    return <span className={`status-badge ${theme}`}>{label}</span>;
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-section">
          <h3>Smart Contract Hub</h3>
          <p>Secure on-chain management</p>
        </div>
        <nav className="sidebar-nav">
          {['Dashboard', 'Contracts', 'Transactions', 'Deploy', 'Settings'].map((item) => (
            <button key={item} className="nav-item">{item}</button>
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <h2>Contracts Overview</h2>
            <p>Live status and registry operations</p>
          </div>
          <div className="topbar-search">
            <input
              type="text"
              placeholder="Filter categories / contracts"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            />
            <button className="search-btn" onClick={searchContracts}>Search</button>
          </div>
        </header>

        <section className="stats-row">
          <div className="metric-card">
            <span>Total Contracts</span>
            <strong>{stats?.total ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span>Active</span>
            <strong>{stats?.active ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span>Inactive</span>
            <strong>{stats?.inactive ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span>Loaded</span>
            <strong>{allContracts.length || 0}</strong>
          </div>
          <button className="load-btn" onClick={listAllContracts}>Refresh Contracts</button>
        </section>

        <section className="cards-grid">
          {allContracts.length === 0 ? (
            <div className="empty-state">No contracts available. Click "Refresh Contracts" to populate.</div>
          ) : (
            allContracts.map((c, idx) => (
              <article key={idx} className="contract-card">
                <div className="card-top">
                  <h3>{c.title || 'Untitled'}</h3>
                  {statusBadge(c)}
                </div>
                <p>{c.descrip}</p>
                <div className="card-meta">
                  <span>{c.category}</span>
                  <span>{c.owner}</span>
                  <span>{new Date(c.reg_time * 1000).toLocaleString()}</span>
                </div>
                <div className="card-footer">ID: {c.id}</div>
              </article>
            ))
          )}
        </section>

        <section className="forms-panel">
          <div className="form-card">
            <h4>Register Contract</h4>
            <form onSubmit={(e) => { e.preventDefault(); registerContract(); }}>
              <input value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Contract ID" required maxLength={64} />
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required />
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner (opt)" />
              <button className="action-btn" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Register'}</button>
            </form>
          </div>

          <div className="form-card">
            <h4>Register External Contract</h4>
            <form onSubmit={(e) => { e.preventDefault(); registerExternalContract(); }}>
              <input value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Contract ID" required maxLength={64} />
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required />
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner (opt)" />
              <input value={externalAddress} onChange={(e) => setExternalAddress(e.target.value)} placeholder="External Address" required />
              <button className="action-btn" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Register External'}</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
