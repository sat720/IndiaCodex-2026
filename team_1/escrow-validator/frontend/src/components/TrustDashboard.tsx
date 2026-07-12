import { useState, useEffect } from 'react';
import { useCardano } from '@cardano-foundation/cardano-connect-with-wallet';
import { TrustService } from '../services/TrustService';
import { Lucid } from 'lucid-cardano';

export default function TrustDashboard() {
  const { isConnected, stakeAddress } = useCardano();
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && stakeAddress) {
      setLoading(true);
      // Initialize a dummy Lucid instance just for the service
      Lucid.new(undefined, 'Preprod').then(lucid => {
        const trustService = new TrustService(lucid);
        trustService.getTrustScore(stakeAddress).then(data => {
          setScoreData(data);
          setLoading(false);
        });
      });
    }
  }, [isConnected, stakeAddress]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 backdrop-blur-md shadow-2xl">
        <div className="w-16 h-16 mb-4 rounded-full bg-cyan-950/50 flex items-center justify-center border border-cyan-900/50">
          <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-200 mb-2">Connect Your Wallet</h2>
        <p className="text-zinc-400 text-center max-w-md">Connect a CIP-30 compatible wallet (Lace, Eternl) to view your decentralized Trust Score derived directly from the Cardano blockchain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/20 rounded-full blur-[80px] -z-10" />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Your Trust Score</h2>
            <p className="text-zinc-400 text-sm mt-1">Calculated from immutable Escrow NFT Receipts</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500 font-mono mb-1">STAKE ADDRESS</div>
            <div className="text-sm font-mono text-zinc-300 bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800/50">
              {stakeAddress?.slice(0, 12)}...{stakeAddress?.slice(-8)}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-900/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-cyan-400/80 text-sm font-medium animate-pulse">Syncing with Cardano Preprod...</p>
          </div>
        ) : scoreData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-zinc-950/40 rounded-2xl border border-zinc-800/50 relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * scoreData.score) / 100}
                  className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-white drop-shadow-md">{scoreData.score}</span>
                <span className="text-xs font-bold text-cyan-400 tracking-widest mt-1">/ 100</span>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <MetricCard title="Completed Escrows" value={scoreData.metrics.completedEscrows} icon="check" />
              <MetricCard title="Total Volume" value={`${scoreData.metrics.totalVolumeADA} ₳`} icon="currency" />
              <MetricCard title="Account Tenure" value={`${scoreData.metrics.tenureDays} Days`} icon="calendar" />
              <MetricCard title="Disputes" value={scoreData.metrics.disputes} icon="warning" bad={scoreData.metrics.disputes > 0} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, bad = false }: { title: string, value: string | number, icon: string, bad?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl border bg-zinc-950/40 flex flex-col justify-between ${bad ? 'border-rose-900/50 shadow-[inset_0_0_20px_rgba(225,29,72,0.05)]' : 'border-zinc-800/50'}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        {icon === 'check' && <div className="w-6 h-6 rounded-full bg-emerald-950/50 text-emerald-500 flex items-center justify-center text-xs border border-emerald-900/50">✓</div>}
        {icon === 'currency' && <div className="w-6 h-6 rounded-full bg-blue-950/50 text-blue-500 flex items-center justify-center text-xs border border-blue-900/50">₳</div>}
        {icon === 'calendar' && <div className="w-6 h-6 rounded-full bg-indigo-950/50 text-indigo-500 flex items-center justify-center text-xs border border-indigo-900/50">⏱</div>}
        {icon === 'warning' && <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${bad ? 'bg-rose-950/50 text-rose-500 border-rose-900/50' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}>!</div>}
      </div>
      <div className={`text-2xl font-bold ${bad ? 'text-rose-400' : 'text-zinc-100'}`}>
        {value}
      </div>
    </div>
  );
}
