import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, TOKEN_ABI } from '../config.js';
import {
  STAKING_REWARDS_ADDRESS,
  LENDING_PROTOCOL_ADDRESS,
  STAKING_REWARDS_ABI,
  LENDING_PROTOCOL_ABI,
} from '../config-phase3.js';

export default function Dashboard({ provider, account }) {
  const [portfolio, setPortfolio] = useState({
    sgtBalance: '0',
    totalStaked: '0',
    stakingRewards: '0',
    totalSupplied: '0',
    supplyInterest: '0',
    totalBorrowed: '0',
    totalValue: '0',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (provider && account) {
      loadPortfolioData();
    }
  }, [provider, account]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();

      const sgtContract = new ethers.Contract(CONTRACT_ADDRESS, TOKEN_ABI, signer);
      const stakingContract = new ethers.Contract(STAKING_REWARDS_ADDRESS, STAKING_REWARDS_ABI, signer);
      const lendingContract = new ethers.Contract(LENDING_PROTOCOL_ADDRESS, LENDING_PROTOCOL_ABI, signer);

      const [
        sgtBalance,
        userStaked,
        rewards,
        supplyData,
      ] = await Promise.all([
        sgtContract.balanceOf(account),
        stakingContract.getUserTotalStaked(account),
        stakingContract.earned(account),
        lendingContract.supplies(account),
      ]);

      const totalValue = parseFloat(ethers.formatUnits(sgtBalance, 18)) +
                        parseFloat(ethers.formatUnits(userStaked, 18)) +
                        parseFloat(ethers.formatUnits(supplyData.amount, 18));

      setPortfolio({
        sgtBalance: ethers.formatUnits(sgtBalance, 18),
        totalStaked: ethers.formatUnits(userStaked, 18),
        stakingRewards: ethers.formatUnits(rewards, 18),
        totalSupplied: ethers.formatUnits(supplyData.amount, 18),
        supplyInterest: ethers.formatUnits(supplyData.interestEarned, 18),
        totalBorrowed: '0',
        totalValue: totalValue.toFixed(2),
      });
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>📊 Portfolio Dashboard</h2>
        <button onClick={loadPortfolioData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="portfolio-summary">
        <div className="summary-card highlight">
          <h3>Total Value</h3>
          <div className="value">${parseFloat(portfolio.totalValue).toLocaleString()}</div>
          <div className="label">SGT Equivalent</div>
        </div>
      </div>

      <div className="portfolio-grid">
        <div className="portfolio-card">
          <div className="card-icon">💰</div>
          <h3>SGT Balance</h3>
          <div className="amount">{parseFloat(portfolio.sgtBalance).toLocaleString()} SGT</div>
          <div className="actions">
            <a href="#transfer" className="action-link">Transfer</a>
            <a href="#stake" className="action-link">Stake</a>
          </div>
        </div>

        <div className="portfolio-card">
          <div className="card-icon">🔒</div>
          <h3>Staked</h3>
          <div className="amount">{parseFloat(portfolio.totalStaked).toLocaleString()} SGT</div>
          <div className="sub-amount">
            Rewards: {parseFloat(portfolio.stakingRewards).toFixed(4)} SGT
          </div>
          <div className="actions">
            <a href="#staking" className="action-link">Manage</a>
          </div>
        </div>

        <div className="portfolio-card">
          <div className="card-icon">🏦</div>
          <h3>Supplied</h3>
          <div className="amount">{parseFloat(portfolio.totalSupplied).toLocaleString()} SGT</div>
          <div className="sub-amount">
            Interest: {parseFloat(portfolio.supplyInterest).toFixed(4)} SGT
          </div>
          <div className="actions">
            <a href="#lending" className="action-link">Manage</a>
          </div>
        </div>

        <div className="portfolio-card">
          <div className="card-icon">📈</div>
          <h3>Borrowed</h3>
          <div className="amount">{parseFloat(portfolio.totalBorrowed).toLocaleString()} SGT</div>
          <div className="sub-amount">Health Factor: --</div>
          <div className="actions">
            <a href="#lending" className="action-link">Manage</a>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => window.location.hash = '#staking'}>
            Stake Tokens
          </button>
          <button className="action-btn" onClick={() => window.location.hash = '#lending'}>
            Supply/Borrow
          </button>
          <button className="action-btn" onClick={() => window.location.hash = '#bridge'}>
            Bridge Assets
          </button>
          <button className="action-btn" onClick={() => window.location.hash = '#nfts'}>
            View NFTs
          </button>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h2 {
          font-size: 2rem;
          color: #1a1a1a;
        }

        .refresh-btn {
          padding: 0.5rem 1rem;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .portfolio-summary {
          margin-bottom: 2rem;
        }

        .summary-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          border-radius: 16px;
          color: white;
          text-align: center;
        }

        .summary-card h3 {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          opacity: 0.9;
        }

        .summary-card .value {
          font-size: 3rem;
          font-weight: bold;
          margin: 1rem 0;
        }

        .summary-card .label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .portfolio-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .portfolio-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .card-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .portfolio-card h3 {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .amount {
          font-size: 1.8rem;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .sub-amount {
          font-size: 0.9rem;
          color: #10b981;
          margin-bottom: 1rem;
        }

        .actions {
          display: flex;
          gap: 1rem;
        }

        .action-link {
          flex: 1;
          text-align: center;
          padding: 0.5rem;
          background: #f3f4f6;
          border-radius: 6px;
          text-decoration: none;
          color: #4f46e5;
          font-weight: 500;
          transition: background 0.2s;
        }

        .action-link:hover {
          background: #e5e7eb;
        }

        .quick-actions {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .quick-actions h3 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .action-btn {
          padding: 1rem;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: #4338ca;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .portfolio-grid {
            grid-template-columns: 1fr;
          }

          .summary-card .value {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
