import { useState, useEffect } from 'react';
import { Lucid } from 'lucid-cardano';

// Minimal Cardano Preprod provider — no API key needed.
// Protocol params are hardcoded (stable values for Preprod testnet).
// UTxOs and submission are handled by the Lace wallet CIP-30 API.
class PreprodProvider {
  api: any;
  constructor(api: any) {
    this.api = api;
  }
  async getProtocolParameters() {
    return {
      minFeeA: 44,
      minFeeB: 155381,
      maxTxSize: 16384,
      maxValSize: 5000,
      keyDeposit: 2000000n,
      poolDeposit: 500000000n,
      priceMem: 0.0577,
      priceStep: 0.0000721,
      maxTxExMem: 14000000n,
      maxTxExSteps: 10000000000n,
      coinsPerUtxoByte: 4310n,
      collateralPercentage: 150,
      maxCollateralInputs: 3,
      costModels: { PlutusV1: {}, PlutusV2: {} },
      minfeeRefscriptCostPerByte: 15,
    };
  }
  async getUtxos() { return []; }
  async getUtxosWithUnit() { return []; }
  async getUtxoByUnit(): Promise<any> { throw new Error('Not implemented'); }
  async getUtxosByOutRef() { return []; }
  async getDelegation() { return { poolId: null, rewards: 0n }; }
  async getDatum(): Promise<any> { throw new Error('Not implemented'); }
  async awaitTx() { return true; }
  async submitTx(tx: string): Promise<string> {
    return await this.api.submitTx(tx);
  }
}

export default function App() {
  const [lucid, setLucid] = useState<Lucid | null>(null);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.00');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Form State
  const [sellerAddr, setSellerAddr] = useState('');
  const [amount, setAmount] = useState('');

  // Escrow State
  const [activeEscrows, setActiveEscrows] = useState<any[]>(() => {
    const saved = localStorage.getItem('trusttrail_active_escrows');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedNFTs, setCompletedNFTs] = useState<any[]>(() => {
    const saved = localStorage.getItem('trusttrail_completed_nfts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('trusttrail_active_escrows', JSON.stringify(activeEscrows));
  }, [activeEscrows]);

  useEffect(() => {
    localStorage.setItem('trusttrail_completed_nfts', JSON.stringify(completedNFTs));
  }, [completedNFTs]);

  // TX Status
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const connectWallet = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      // @ts-ignore
      if (!window.cardano || !window.cardano.lace) {
        setConnectError('Lace wallet not detected. Install the Lace browser extension.');
        return;
      }
      // @ts-ignore
      const api = await window.cardano.lace.enable();
      const l = await Lucid.new(new PreprodProvider(api) as any, 'Preprod');
      l.selectWallet(api);

      const addr = await l.wallet.address();
      setAddress(addr);

      const utxos = await l.wallet.getUtxos();
      const lovelace = utxos.reduce((acc, utxo) => acc + utxo.assets.lovelace, 0n);
      setBalance((Number(lovelace) / 1_000_000).toFixed(2));

      setLucid(l);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setConnectError(msg.includes('user declined') ? 'You declined the wallet connection.' : msg);
      console.error('Wallet connection failed:', err);
    } finally {
      setConnecting(false);
    }
  };


  const handleCreateEscrow = async () => {
    if (!amount || !sellerAddr || !lucid) return;
    if (sellerAddr.length < 50) {
      setTxError("Please enter a valid full Cardano testnet address (addr_test1...).");
      return;
    }
    setTxError(null);
    setTxHash(null);
    setTxLoading(true);
    try {
      const amountLovelace = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

      // Build a real ADA transfer to the seller address.
      // This demonstrates the fund movement on-chain and is verifiable on Cardanoscan.
      // In production with Blockfrost, funds go to the Escrow Validator contract address instead.
      const tx = await lucid
        .newTx()
        .payToAddress(sellerAddr, { lovelace: amountLovelace })
        .complete();

      const signed = await tx.sign().complete();
      const hash = await signed.submit();

      setTxHash(hash);
      setActiveEscrows(prev => [...prev, {
        id: hash.slice(0, 8),
        seller: sellerAddr,
        amount: amount,
        txHash: hash,
        utxo: null,
      }]);
      setSellerAddr('');
      setAmount('');
    } catch (err: any) {
      // Surface a clean message
      const msg = err?.message ?? String(err);
      setTxError(msg.includes('Not enough') || msg.includes('INPUT_LIMIT_EXCEEDED')
        ? 'Not enough ADA in wallet. Try a smaller amount.'
        : msg);
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };


  const handleRelease = async (id: string, escrowAmount: string, utxo?: any) => {
    if (!lucid) return;
    setTxError(null);
    setTxHash(null);

    // If we have a real UTxO (from blockchain), use the service
    if (utxo) {
      setTxLoading(true);
      try {
        // Release payment — just move escrow to completed state in demo mode
        // (real UTxO spending requires Blockfrost for chain queries)
        await new Promise(r => setTimeout(r, 1000)); // simulate tx
        const hash = 'demo_release_' + id;
        setTxHash(hash);
        setActiveEscrows(prev => prev.filter(e => e.id !== id));
        setCompletedNFTs(prev => [...prev, {
          id,
          name: `Escrow${id.toUpperCase()}_Completed`,
          amount: escrowAmount,
          txHash: hash,
        }]);
      } catch (err: any) {
        setTxError(err?.message ?? 'Release failed. Check console.');
        console.error(err);
      } finally {
        setTxLoading(false);
      }
    } else {
      // Demo mode: optimistically mark as released (UTxO not yet fetched)
      setActiveEscrows(prev => prev.filter(e => e.id !== id));
      setCompletedNFTs(prev => [...prev, {
        id,
        name: `Escrow${id.toUpperCase()}_Completed`,
        amount: escrowAmount,
      }]);
    }
  };

  if (!lucid) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-900/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="z-10 max-w-md w-full bg-zinc-900/60 p-10 rounded-3xl border border-zinc-800/80 backdrop-blur-xl shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <svg className="w-10 h-10 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">TrustTrail</h1>
          <p className="text-zinc-400 mb-10 leading-relaxed">The decentralized escrow protocol for Cardano. Connect your Lace wallet to continue.</p>
          <button 
            onClick={connectWallet}
            disabled={connecting}
            className="w-full bg-zinc-100 hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed text-zinc-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {connecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Connecting...
              </span>
            ) : 'Connect Lace Wallet'}
          </button>
          {connectError && (
            <p className="mt-4 text-sm text-rose-400 text-center">{connectError}</p>
          )}
        </div>
      </div>
    );
  }

  // Calculate Trust Score based on completed NFTs
  const trustScore = Math.min(100, 50 + (completedNFTs.length * 15));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pb-20 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-[600px] h-[300px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[300px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-6xl">
        {/* Header (Wallet & Stats) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TrustTrail</h1>
              <div className="text-zinc-400 font-mono text-sm mt-1">{address.slice(0, 15)}...{address.slice(-10)}</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Balance</div>
              <div className="text-xl font-mono font-semibold text-zinc-200">{balance} ₳</div>
            </div>
            <div className="h-10 w-px bg-zinc-800"></div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Trust Score</div>
              <div className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{trustScore}</div>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Create Escrow */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800/80 backdrop-blur-xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">Create New Escrow</h2>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Seller Address</label>
                    <button
                      type="button"
                      onClick={() => setSellerAddr(address)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                    >
                      + Use My Address (Demo)
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={sellerAddr}
                    onChange={e => setSellerAddr(e.target.value)}
                    placeholder="addr_test1..." 
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                  />
                  {sellerAddr && sellerAddr.length < 50 && (
                    <p className="text-xs text-amber-500 mt-1">⚠ Address looks too short. Paste a full addr_test1... address.</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Amount to Lock (ADA)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="100" 
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                    />
                    <div className="absolute right-4 top-3.5 text-zinc-500 font-bold">₳</div>
                  </div>
                </div>

                <button 
                  onClick={handleCreateEscrow}
                  disabled={txLoading}
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-emerald-600 disabled:cursor-not-allowed text-zinc-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                >
                  {txLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Waiting for Signature...
                    </span>
                  ) : 'Lock Funds'}
                </button>

                {/* TX Feedback */}
                {txHash && (
                  <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl">
                    <p className="text-xs text-emerald-400 font-bold mb-1">✓ Transaction Submitted!</p>
                    <a
                      href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-500/80 font-mono break-all hover:underline"
                    >
                      {txHash.slice(0, 20)}...{txHash.slice(-10)}
                    </a>
                  </div>
                )}
                {txError && (
                  <div className="mt-3 p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl">
                    <p className="text-xs text-rose-400 font-bold mb-1">✗ Error</p>
                    <p className="text-xs text-rose-500/80">{txError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active & Completed */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Active Escrows */}
            <div>
              <h2 className="text-lg font-bold text-zinc-300 mb-4 px-2">Active Escrows (Awaiting Delivery)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEscrows.length === 0 ? (
                  <div className="col-span-full p-8 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-500">
                    No active escrows right now.
                  </div>
                ) : activeEscrows.map(escrow => (
                  <div key={escrow.id} className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-700 hover:border-zinc-600 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-amber-950/50 text-amber-500 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-900/50">LOCKED</span>
                      <span className="text-xl font-bold font-mono text-zinc-100">{escrow.amount} ₳</span>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mb-6 truncate" title={escrow.seller}>
                      To: {escrow.seller}
                    </div>
                    <button 
                      onClick={() => handleRelease(escrow.id, escrow.amount, escrow.utxo)}
                      disabled={txLoading}
                      className="w-full bg-cyan-950 hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 border border-cyan-800/50 font-bold py-2.5 rounded-xl transition-all text-sm shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    >
                      Approve & Release Funds
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed / NFTs */}
            <div>
              <h2 className="text-lg font-bold text-zinc-300 mb-4 px-2">Reputation NFTs Minted</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {completedNFTs.length === 0 ? (
                  <div className="col-span-full p-8 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-500">
                    Complete an escrow to mint a reputation NFT.
                  </div>
                ) : completedNFTs.map(nft => (
                  <div key={nft.id} className="bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 p-1 rounded-2xl">
                    <div className="bg-zinc-950 rounded-xl p-4 h-full border border-zinc-800/50 flex flex-col">
                      <div className="w-full aspect-square bg-zinc-900 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <svg className="w-10 h-10 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mb-1 truncate">{nft.name}</div>
                      <div className="text-xs text-zinc-500">Volume: {nft.amount} ₳</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

