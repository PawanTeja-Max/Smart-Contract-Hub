import React, { useState, useEffect, useCallback } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { Contract, TransactionBuilder, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';

// ─── Category Icon SVGs ──────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  defi: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" opacity="0.5"/></svg>`,
  nft: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l4-4 3 3 4-4 7 7"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>`,
  dao: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="3"/><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M12 10v3M8.5 15l-2 0M15.5 15l2 0"/></svg>`,
  gaming: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="4"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><path d="M11 10v4M9 12h4"/></svg>`,
  utility: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
};

const DEFAULT_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v4l3 3"/></svg>`;

function getCategoryIcon(category: string): string {
  const key = category.toLowerCase().trim();
  return CATEGORY_ICONS[key] || DEFAULT_ICON;
}

// ─── Social Link Icons ───────────────────────────────────────────────────────
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
);

const WebIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
);

const DocsIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
);

const UpvoteIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
);

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
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [searchCategory, setSearchCategory] = useState('');
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      const args = [
        contractId, title, description, category, owner || address,
        githubUrl || null, websiteUrl || null, docsUrl || null,
      ];
      await callContract('register_contract', args);
      alert('Contract registered successfully!');
      setContractId(''); setTitle(''); setDescription('');
      setCategory(''); setOwner('');
      setGithubUrl(''); setWebsiteUrl(''); setDocsUrl('');
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
      const args = [
        contractId, title, description, category, owner || address, externalAddress,
        githubUrl || null, websiteUrl || null, docsUrl || null,
      ];
      await callContract('register_external_contract', args);
      alert('External contract registered successfully!');
      setContractId(''); setTitle(''); setDescription('');
      setCategory(''); setOwner(''); setExternalAddress('');
      setGithubUrl(''); setWebsiteUrl(''); setDocsUrl('');
      loadStats();
      listAllContracts();
    } catch (error) {
      console.error(error);
      alert('Error registering external contract');
    }
    setLoading(false);
  };

  const upvoteContract = async (id: string) => {
    setLoading(true);
    try {
      await callContract('upvote_contract', [id]);
      listAllContracts();
    } catch (error) {
      console.error(error);
      alert('Error upvoting contract');
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

  // ─── Deep Linking ────────────────────────────────────────────────────────────
  const handleHashRoute = useCallback(async () => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/contract\/(.+)$/);
    if (match && match[1] && address) {
      const id = decodeURIComponent(match[1]);
      const data = await viewContract(id);
      if (data && data.reg_time !== 0) {
        setSelectedContract(data);
      } else {
        setSelectedContract({ id, title: 'Not Found', descrip: 'No contract found with this ID.', category: '', owner: '', reg_time: 0, is_active: false, votes: 0 });
      }
    }
  }, [address, server]);

  useEffect(() => {
    if (address) {
      loadStats();
      listAllContracts();
      handleHashRoute();
    }

    const onHashChange = () => handleHashRoute();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [address, handleHashRoute]);

  const shareContract = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/contract/${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const openContractDetail = async (c: any) => {
    setSelectedContract(c);
    window.location.hash = `/contract/${encodeURIComponent(c.id)}`;
  };

  const closeModal = () => {
    setSelectedContract(null);
    window.location.hash = '';
  };

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
              <article key={idx} className="contract-card" onClick={() => openContractDetail(c)} style={{ cursor: 'pointer' }}>
                <div className="card-top">
                  <h3>{c.title || 'Untitled'}</h3>
                  <div className="card-top-actions">
                    {statusBadge(c)}
                    <button
                      className="share-btn"
                      onClick={(e) => { e.stopPropagation(); shareContract(c.id); }}
                      title="Copy share link"
                    >
                      <ShareIcon />
                      {copiedId === c.id && <span className="copied-tooltip">Copied!</span>}
                    </button>
                  </div>
                </div>
                <p>{c.descrip}</p>
                <div className="card-meta">
                  <span className="category-icon" dangerouslySetInnerHTML={{ __html: getCategoryIcon(c.category) + ' ' + c.category }} />
                  <span>{c.owner?.slice(0, 8)}...</span>
                  <span>{new Date(c.reg_time * 1000).toLocaleString()}</span>
                </div>
                {/* Social Links */}
                {(c.github_url || c.website || c.docs_url) && (
                  <div className="social-links" onClick={(e) => e.stopPropagation()}>
                    {c.github_url && <a href={c.github_url} target="_blank" rel="noopener noreferrer" title="GitHub"><GithubIcon /></a>}
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" title="Website"><WebIcon /></a>}
                    {c.docs_url && <a href={c.docs_url} target="_blank" rel="noopener noreferrer" title="Docs"><DocsIcon /></a>}
                  </div>
                )}
                <div className="card-footer">
                  <span>ID: {c.id}</span>
                  <button
                    className="upvote-btn"
                    onClick={(e) => { e.stopPropagation(); upvoteContract(c.id); }}
                    disabled={loading || !c.is_active}
                    title="Upvote this contract"
                  >
                    <UpvoteIcon />
                    <span>{c.votes ?? 0}</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        {/* ─── Deep Link Modal ─────────────────────────────────────────────── */}
        {selectedContract && (
          <div className="contract-modal-overlay" onClick={closeModal}>
            <div className="contract-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>✕</button>
              <h2>{selectedContract.title || 'Unknown'}</h2>
              {selectedContract.reg_time !== 0 && statusBadge(selectedContract)}
              <p className="modal-desc">{selectedContract.descrip}</p>
              <div className="modal-details">
                <div className="modal-row">
                  <span>ID</span><strong>{selectedContract.id}</strong>
                </div>
                <div className="modal-row">
                  <span>Category</span>
                  <strong className="category-icon" dangerouslySetInnerHTML={{ __html: getCategoryIcon(selectedContract.category || '') + ' ' + (selectedContract.category || 'N/A') }} />
                </div>
                <div className="modal-row">
                  <span>Owner</span><strong>{selectedContract.owner || 'N/A'}</strong>
                </div>
                <div className="modal-row">
                  <span>Registered</span><strong>{selectedContract.reg_time ? new Date(selectedContract.reg_time * 1000).toLocaleString() : 'N/A'}</strong>
                </div>
                <div className="modal-row">
                  <span>Votes</span><strong>{selectedContract.votes ?? 0}</strong>
                </div>
                {selectedContract.external_address && (
                  <div className="modal-row">
                    <span>External Address</span><strong>{selectedContract.external_address}</strong>
                  </div>
                )}
              </div>
              {/* Social links in modal */}
              {(selectedContract.github_url || selectedContract.website || selectedContract.docs_url) && (
                <div className="social-links modal-social">
                  {selectedContract.github_url && <a href={selectedContract.github_url} target="_blank" rel="noopener noreferrer" title="GitHub"><GithubIcon /> GitHub</a>}
                  {selectedContract.website && <a href={selectedContract.website} target="_blank" rel="noopener noreferrer" title="Website"><WebIcon /> Website</a>}
                  {selectedContract.docs_url && <a href={selectedContract.docs_url} target="_blank" rel="noopener noreferrer" title="Docs"><DocsIcon /> Docs</a>}
                </div>
              )}
              <div className="modal-actions">
                {selectedContract.is_active && (
                  <button className="upvote-btn modal-upvote" onClick={() => upvoteContract(selectedContract.id)} disabled={loading}>
                    <UpvoteIcon /> Upvote ({selectedContract.votes ?? 0})
                  </button>
                )}
                <button className="share-btn modal-share" onClick={() => shareContract(selectedContract.id)}>
                  <ShareIcon /> {copiedId === selectedContract.id ? 'Copied!' : 'Share Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="forms-panel">
          <div className="form-card">
            <h4>Register Contract</h4>
            <form onSubmit={(e) => { e.preventDefault(); registerContract(); }}>
              <input value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Contract ID" required maxLength={64} />
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (DeFi, NFT, DAO...)" required />
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner (opt)" />
              <div className="form-divider"><span>Social Links (optional)</span></div>
              <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL" />
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Website URL" />
              <input value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} placeholder="Documentation URL" />
              <button className="action-btn" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Register'}</button>
            </form>
          </div>

          <div className="form-card">
            <h4>Register External Contract</h4>
            <form onSubmit={(e) => { e.preventDefault(); registerExternalContract(); }}>
              <input value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Contract ID" required maxLength={64} />
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (DeFi, NFT, DAO...)" required />
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner (opt)" />
              <input value={externalAddress} onChange={(e) => setExternalAddress(e.target.value)} placeholder="External Address" required />
              <div className="form-divider"><span>Social Links (optional)</span></div>
              <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL" />
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Website URL" />
              <input value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} placeholder="Documentation URL" />
              <button className="action-btn" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Register External'}</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
