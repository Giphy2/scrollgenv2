import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, TOKEN_ABI } from '../config.js';
import {
  LENDING_PROTOCOL_ADDRESS,
  LENDING_PROTOCOL_ABI,
  LENDING_PARAMS,
} from '../config-phase3.js';

export default function LendingUI({ provider, account }) {
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [stats, setStats] = useState({
    supplied: '0',
    interest: '0',
    supplyAPY: '0',
    borrowAPY: '0',
    utilization: '0',
  });
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  useEffect(() => {
    if (provider && account) {
      loadLendingData();
    }
  }, [provider, account]);

  const loadLendingData = async () => {
    try {
      const signer = await provider.getSigner();
      const lendingContract = new ethers.Contract(LENDING_PROTOCOL_ADDRESS, LENDING_PROTOCOL_ABI, signer);

      const [supply, userBorrows, supplyAPY, borrowAPY, utilization] = await Promise.all([
        lendingContract.supplies(account),
        lendingContract.getUserBorrows(account),
        lendingContract.supplyAPY(),
        lendingContract.borrowAPY(),
        lendingContract.utilizationRate(),
      ]);

      setStats({
        supplied: ethers.formatUnits(supply.amount, 18),
        interest: ethers.formatUnits(supply.interestEarned, 18),
        supplyAPY: (Number(supplyAPY) / 1e16).toFixed(2),
        borrowAPY: (Number(borrowAPY) / 1e16).toFixed(2),
        utilization: (Number(utilization) / 1).toFixed(0),
      });

      setBorrows(userBorrows.filter(b => Number(b.borrowed) > 0).map((b, index) => ({
        index,
        collateral: ethers.formatUnits(b.collateral, 18),
        borrowed: ethers.formatUnits(b.borrowed, 18),
        interest: ethers.formatUnits(b.interestAccrued, 18),
        asset: b.asset,
      })));
    } catch (error) {
      console.error('Error loading lending data:', error);
    }
  };

  const handleSupply = async (e) => {
    e.preventDefault();
    if (!supplyAmount || parseFloat(supplyAmount) <= 0) {
      setTxStatus('❌ Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setTxStatus('Approving SGT...');

      const signer = await provider.getSigner();
      const sgtContract = new ethers.Contract(CONTRACT_ADDRESS, TOKEN_ABI, signer);
      const lendingContract = new ethers.Contract(LENDING_PROTOCOL_ADDRESS, LENDING_PROTOCOL_ABI, signer);

      const amount = ethers.parseUnits(supplyAmount, 18);

      const approveTx = await sgtContract.approve(LENDING_PROTOCOL_ADDRESS, amount);
      await approveTx.wait();

      setTxStatus('Supplying collateral...');
      const supplyTx = await lendingContract.supply(amount);
      await supplyTx.wait();

      setTxStatus('✅ Supplied successfully!');
      setSupplyAmount('');
      await loadLendingData();

      setTimeout(() => setTxStatus(''), 3000);
    } catch (error) {
      console.error('Supply error:', error);
      setTxStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount) => {
    try {
      setLoading(true);
      setTxStatus('Withdrawing...');

      const signer = await provider.getSigner();
      const lendingContract = new ethers.Contract(LENDING_PROTOCOL_ADDRESS, LENDING_PROTOCOL_ABI, signer);

      const withdrawAmount = ethers.parseUnits(amount, 18);
      const tx = await lendingContract.withdraw(withdrawAmount);
      await tx.wait();

      setTxStatus('✅ Withdrawn successfully!');
      await loadLendingData();

      setTimeout(() => setTxStatus(''), 3000);
    } catch (error) {
      console.error('Withdraw error:', error);
      setTxStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthFactor = (borrow) => {
    const collateralValue = parseFloat(borrow.collateral) * LENDING_PARAMS.LIQUIDATION_THRESHOLD / 100;
    const borrowValue = parseFloat(borrow.borrowed) + parseFloat(borrow.interest);
    if (borrowValue === 0) return 100;
    return ((collateralValue / borrowValue) * 100).toFixed(2);
  };

  return (
    <div className="lending-container">
      <h2>🏦 Lending Market</h2>

      <div className="lending-stats">
        <div className="stat-card">
          <div className="stat-label">Supply APY</div>
          <div className="stat-value">{stats.supplyAPY}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Borrow APY</div>
          <div className="stat-value">{stats.borrowAPY}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Utilization</div>
          <div className="stat-value">{stats.utilization}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Your Supplied</div>
          <div className="stat-value">{parseFloat(stats.supplied).toLocaleString()} SGT</div>
        </div>
      </div>

      <div className="lending-grid">
        <div className="lending-card">
          <h3>Supply Collateral</h3>
          <form onSubmit={handleSupply}>
            <div className="form-group">
              <label>Amount (SGT)</label>
              <input
                type="number"
                value={supplyAmount}
                onChange={(e) => setSupplyAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Supply'}
            </button>
          </form>

          {parseFloat(stats.supplied) > 0 && (
            <div className="supplied-info">
              <div className="info-row">
                <span>Supplied:</span>
                <span>{parseFloat(stats.supplied).toFixed(2)} SGT</span>
              </div>
              <div className="info-row">
                <span>Interest Earned:</span>
                <span className="green">{parseFloat(stats.interest).toFixed(4)} SGT</span>
              </div>
              <button
                onClick={() => handleWithdraw(stats.supplied)}
                className="btn-secondary"
                disabled={loading}
              >
                Withdraw All
              </button>
            </div>
          )}
        </div>

        <div className="lending-card">
          <h3>Your Borrows</h3>
          {borrows.length === 0 ? (
            <div className="empty-state">
              <p>No active borrows</p>
              <p className="hint">Supply collateral to borrow</p>
            </div>
          ) : (
            <div className="borrows-list">
              {borrows.map((borrow) => (
                <div key={borrow.index} className="borrow-item">
                  <div className="borrow-header">
                    <div className="borrow-amount">{parseFloat(borrow.borrowed).toFixed(2)} ETH</div>
                    <div className={`health-factor ${parseFloat(calculateHealthFactor(borrow)) < 120 ? 'warning' : 'healthy'}`}>
                      Health: {calculateHealthFactor(borrow)}%
                    </div>
                  </div>
                  <div className="borrow-details">
                    <div className="detail-row">
                      <span>Collateral:</span>
                      <span>{parseFloat(borrow.collateral).toFixed(2)} SGT</span>
                    </div>
                    <div className="detail-row">
                      <span>Interest:</span>
                      <span>{parseFloat(borrow.interest).toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {txStatus && <div className="tx-status">{txStatus}</div>}

      <div className="lending-info">
        <h4>📊 How It Works</h4>
        <ul>
          <li>Supply SGT to earn {stats.supplyAPY}% APY</li>
          <li>Borrow up to {LENDING_PARAMS.LTV_RATIO}% of your collateral value</li>
          <li>Maintain health factor above 100% to avoid liquidation</li>
          <li>Liquidation occurs at {LENDING_PARAMS.LIQUIDATION_THRESHOLD}% with {LENDING_PARAMS.LIQUIDATION_PENALTY}% penalty</li>
        </ul>
      </div>

      <style jsx>{`
        .lending-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
        }

        .lending-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1a1a1a;
        }

        .lending-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .lending-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .lending-card h3 {
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338ca;
        }

        .btn-secondary {
          background: #10b981;
          color: white;
          margin-top: 1rem;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .supplied-info {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .info-row,
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .green {
          color: #10b981;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        .hint {
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .borrows-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .borrow-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          background: #f9fafb;
        }

        .borrow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .borrow-amount {
          font-size: 1.3rem;
          font-weight: bold;
        }

        .health-factor {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .health-factor.healthy {
          background: #d1fae5;
          color: #065f46;
        }

        .health-factor.warning {
          background: #fee2e2;
          color: #991b1b;
        }

        .borrow-details {
          font-size: 0.9rem;
        }

        .tx-status {
          margin-top: 1rem;
          padding: 1rem;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
        }

        .lending-info {
          background: #eff6ff;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #dbeafe;
        }

        .lending-info h4 {
          margin-bottom: 1rem;
        }

        .lending-info ul {
          list-style: none;
          padding: 0;
        }

        .lending-info li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .lending-info li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #3b82f6;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .lending-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
