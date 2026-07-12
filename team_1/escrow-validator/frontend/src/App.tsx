import { useState, useEffect } from 'react';
import { Lucid } from 'lucid-cardano';

export default function App() {
  const [lucid, setLucid] = useState<Lucid | null>(null);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.00');
  
  // Form State
  const [sellerAddr, setSellerAddr] = useState('');
  const [amount, setAmount] = useState('');
  
  // Escrow State
  const [activeEscrows, setActiveEscrows] = useState<any[]>([]);
  const [completedNFTs, setCompletedNFTs] = useState<any[]>([]);

  const connectWallet = async () => {
    try {
      // @ts-ignore
      if (!window.cardano || !window.cardano.lace) {
        alert("Lace wallet not detected. Please install the Lace browser extension.");
        return;
      }
      // @ts-ignore
      const api = await window.cardano.lace.enable();
      const l = await Lucid.new(undefined, "Preprod");
      l.selectWallet(api);
      
      const addr = await l.wallet.address();
      setAddress(addr);
      
      const utxos = await l.wallet.getUtxos();
      const lovelace = utxos.reduce((acc, utxo) => acc + utxo.assets.lovelace, 0n);
      setBalance((Number(lovelace) / 1000000).toFixed(2));
      
      setLucid(l);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const handleCreateEscrow = () => {
    if (!amount || !sellerAddr) return;
    const newEscrow = {
      id: Math.random().toString(36).substring(2, 10),
      seller: sellerAddr,
      amount: amount,
      status: 'LOCKED'
    };
    setActiveEscrows([...activeEscrows, newEscrow]);
    setSellerAddr('');
    setAmount('');
  };

  const handleRelease = (id: string, escrowAmount: string) => {
    // Move from active to completed and "mint" NFT
    setActiveEscrows(activeEscrows.filter(e => e.id !== id));
    setCompletedNFTs([...completedNFTs, {
      id,
      name: `Escrow${id.toUpperCase()}_Completed`,
      amount: escrowAmount
    }]);
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
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Connect Lace Wallet
          </button>
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
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Seller Address</label>
                  <input 
                    type="text" 
                    value={sellerAddr}
                    onChange={e => setSellerAddr(e.target.value)}
                    placeholder="addr_test1..." 
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                  />
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
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                >
                  Lock Funds
                </button>
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
                      onClick={() => handleRelease(escrow.id, escrow.amount)}
                      className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800/50 font-bold py-2.5 rounded-xl transition-all text-sm shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
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

