import { useEffect, useState } from 'react';
import { Coins, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

export default function TokenInfo({ contract, account }) {
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    totalSupply: '0',
    balance: '0',
  });
  const [loading, setLoading] = useState(true);

  const loadTokenData = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const [name, symbol, totalSupply, balance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
        contract.balanceOf(account),
      ]);

      setTokenData({
        name,
        symbol,
        totalSupply: ethers.formatUnits(totalSupply, 18),
        balance: ethers.formatUnits(balance, 18),
      });
    } catch (error) {
      console.error('Error loading token data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokenData();
  }, [contract, account]);

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading" style={{ width: '32px', height: '32px' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="card-title">Token Information</h2>
        <button className="secondary" onClick={loadTokenData} style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Coins size={20} color="var(--accent)" />
            <div className="stat-label">Token Name</div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {tokenData.name} ({tokenData.symbol})
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent)" />
            <div className="stat-label">Total Supply</div>
          </div>
          <div className="stat-value">
            {parseFloat(tokenData.totalSupply).toLocaleString()} {tokenData.symbol}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={20} color="var(--accent)" />
            <div className="stat-label">Your Balance</div>
          </div>
          <div className="stat-value">
            {parseFloat(tokenData.balance).toLocaleString()} {tokenData.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}
