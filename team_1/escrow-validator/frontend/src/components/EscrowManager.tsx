import { useState } from 'react';
import { useCardano } from '@cardano-foundation/cardano-connect-with-wallet';

export default function EscrowManager() {
  const { isConnected } = useCardano();
  
  const [sellerAddress, setSellerAddress] = useState('');
  const [arbiterAddress, setArbiterAddress] = useState('');
  const [amount, setAmount] = useState('');
  
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-12 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 backdrop-blur-md">
        <p className="text-zinc-400">Connect wallet to manage escrows.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Create Escrow Form */}
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/10 rounded-full blur-[60px] -z-10" />
          
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-emerald-950/50 flex items-center justify-center text-emerald-400 mr-3 border border-emerald-900/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </span>
            Create Escrow
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Seller Address</label>
              <input 
                type="text" 
                value={sellerAddress}
                onChange={(e) => setSellerAddress(e.target.value)}
                placeholder="addr_test1..." 
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono placeholder:text-zinc-700"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Arbiter Address</label>
              <input 
                type="text" 
                value={arbiterAddress}
                onChange={(e) => setArbiterAddress(e.target.value)}
                placeholder="addr_test1..." 
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono placeholder:text-zinc-700"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Amount (ADA)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100" 
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono placeholder:text-zinc-700"
                />
                <div className="absolute right-4 top-3 text-zinc-500 font-bold">₳</div>
              </div>
            </div>

            <button className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all transform active:scale-[0.98]">
              Lock Funds in Contract
            </button>
          </div>
        </div>

        {/* Active Escrows */}
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-md shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-indigo-950/50 flex items-center justify-center text-indigo-400 mr-3 border border-indigo-900/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </span>
            Active Escrows
          </h2>
          
          {/* Mock active escrow for demo visualization */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex flex-col group hover:border-zinc-700 transition-all">
            <div className="flex justify-between items-center mb-3">
              <span className="bg-indigo-950 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Awaiting Delivery</span>
              <span className="text-zinc-300 font-mono text-sm font-semibold">500 ₳</span>
            </div>
            
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Escrow ID:</span>
                <span className="text-zinc-400 font-mono">1a2b3c4d</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Seller:</span>
                <span className="text-zinc-400 font-mono">addr_test1...9f8e</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2 rounded-lg transition-all">
                Refund
              </button>
              <button className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-900/50 hover:border-cyan-800 text-xs font-semibold py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(8,145,178,0.1)]">
                Release Funds
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
