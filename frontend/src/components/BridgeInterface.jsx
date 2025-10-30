import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  BRIDGE_CONNECTOR_ADDRESS,
  BRIDGE_CONNECTOR_ABI,
  BRIDGE_STATUS,
  BRIDGE_DIRECTION,
  BRIDGE_PARAMS,
} from '../config-phase3.js';

export default function BridgeInterface({ provider, account }) {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('deposit');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  useEffect(() => {
    if (provider && account) {
      loadBridgeData();
    }
  }, [provider, account]);

  const loadBridgeData = async () => {
    try {
      const signer = await provider.getSigner();
      const bridgeContract = new ethers.Contract(BRIDGE_CONNECTOR_ADDRESS, BRIDGE_CONNECTOR_ABI, signer);

      const txHashes = await bridgeContract.getUserTransactions(account);

      const txDetails = await Promise.all(
        txHashes.slice(0, 10).map(async (hash) => {
          const tx = await bridgeContract.getTransaction(hash);
          return {
            hash: hash,
            amount: ethers.formatUnits(tx.amount, 18),
            timestamp: new Date(Number(tx.timestamp) * 1000),
            direction: Number(tx.direction),
            status: Number(tx.status),
            claimableAt: tx.claimableAt,
          };
        })
      );

      setTransactions(txDetails);
    } catch (error) {
      console.error('Error loading bridge data:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      0: '#fbbf24', // Pending - yellow
      1: '#3b82f6', // Confirmed - blue
      2: '#8b5cf6', // Batched - purple
      3: '#10b981', // Finalized - green
      4: '#10b981', // Ready to Claim - green
      5: '#059669', // Completed - dark green
      6: '#ef4444', // Failed - red
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      0: '⏳',
      1: '✅',
      2: '📦',
      3: '🔒',
      4: '🎁',
      5: '✅',
      6: '❌',
    };
    return icons[status] || '❓';
  };

  const getTimeRemaining = (claimableAt) => {
    const now = Date.now();
    const claimTime = Number(claimableAt) * 1000;
    const diff = claimTime - now;

    if (diff <= 0) return 'Ready to claim';

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    return `${days}d ${hours}h remaining`;
  };

  const handleBridge = async (e) => {
    e.preventDefault();
    setTxStatus('Bridge functionality requires actual L1/L2 transactions. This is a UI demonstration.');
  };

  return (
    <div className="bridge-container">
      <h2>🌉 Scroll Bridge</h2>

      <div className="bridge-selector">
        <button
          className={`selector-btn ${direction === 'deposit' ? 'active' : ''}`}
          onClick={() => setDirection('deposit')}
        >
          Deposit (L1 → L2)
        </button>
        <button
          className={`selector-btn ${direction === 'withdraw' ? 'active' : ''}`}
          onClick={() => setDirection('withdraw')}
        >
          Withdraw (L2 → L1)
        </button>
      </div>

      <div className="bridge-form-card">
        <h3>{direction === 'deposit' ? 'Deposit to Scroll' : 'Withdraw to Ethereum'}</h3>

        <form onSubmit={handleBridge}>
          <div className="form-group">
            <label>Amount (ETH)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              disabled={loading}
            />
          </div>

          <div className="bridge-info">
            <div className="info-item">
              <span className="info-label">⏱️ Estimated Time:</span>
              <span className="info-value">
                {direction === 'deposit'
                  ? '~10-20 minutes'
                  : '~7 days + claim'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">💰 Estimated Cost:</span>
              <span className="info-value">
                {direction === 'deposit' ? '~$5' : '~$8'}
              </span>
            </div>
            {direction === 'withdraw' && (
              <div className="warning-box">
                ⚠️ Withdrawals require a 7-day challenge period for security
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : `Bridge ${direction === 'deposit' ? 'to Scroll' : 'to Ethereum'}`}
          </button>
        </form>

        {txStatus && <div className="tx-status">{txStatus}</div>}
      </div>

      <div className="transactions-card">
        <h3>Transaction History</h3>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No bridge transactions yet</p>
            <p className="hint">Your transactions will appear here</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="tx-header">
                  <div className="tx-direction">
                    {tx.direction === 0 ? '📥 Deposit' : '📤 Withdrawal'}
                  </div>
                  <div
                    className="tx-status-badge"
                    style={{ backgroundColor: getStatusColor(tx.status) }}
                  >
                    {getStatusIcon(tx.status)} {BRIDGE_STATUS[tx.status]}
                  </div>
                </div>

                <div className="tx-details">
                  <div className="detail-row">
                    <span>Amount:</span>
                    <span className="amount">{parseFloat(tx.amount).toFixed(4)} ETH</span>
                  </div>
                  <div className="detail-row">
                    <span>Date:</span>
                    <span>{tx.timestamp.toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>Time:</span>
                    <span>{tx.timestamp.toLocaleTimeString()}</span>
                  </div>
                  {tx.status === 4 && (
                    <div className="detail-row highlight">
                      <span>⏰</span>
                      <span>{getTimeRemaining(tx.claimableAt)}</span>
                    </div>
                  )}
                </div>

                {tx.status === 4 && (
                  <button className="btn-claim">
                    Claim Withdrawal
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bridge-guide">
        <h4>📚 Bridge Guide</h4>
        <div className="guide-grid">
          <div className="guide-item">
            <h5>Deposits (L1 → L2)</h5>
            <ul>
              <li>Transaction confirms on Ethereum (~15 seconds)</li>
              <li>Batch inclusion (~5-10 minutes)</li>
              <li>Finalization on Scroll (~10-20 minutes total)</li>
              <li>Assets available immediately after finalization</li>
            </ul>
          </div>
          <div className="guide-item">
            <h5>Withdrawals (L2 → L1)</h5>
            <ul>
              <li>Initiate withdrawal on Scroll (instant)</li>
              <li>7-day challenge period (security measure)</li>
              <li>Claim on Ethereum after challenge period</li>
              <li>Requires L1 gas for claiming</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bridge-container {
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
        }

        .bridge-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .selector-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .selector-btn.active {
          border-color: #4f46e5;
          background: #4f46e5;
          color: white;
        }

        .bridge-form-card,
        .transactions-card,
        .bridge-guide {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        h3,
        h4 {
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

        .bridge-info {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .info-label {
          color: #6b7280;
        }

        .info-value {
          font-weight: 500;
        }

        .warning-box {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .btn-primary,
        .btn-claim {
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

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-claim {
          background: #10b981;
          color: white;
          margin-top: 1rem;
        }

        .tx-status {
          margin-top: 1rem;
          padding: 1rem;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
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

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .transaction-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          background: #f9fafb;
        }

        .tx-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .tx-direction {
          font-size: 1.1rem;
          font-weight: 500;
        }

        .tx-status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.85rem;
          color: white;
          font-weight: 500;
        }

        .tx-details {
          font-size: 0.9rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row.highlight {
          background: #fef3c7;
          padding: 0.75rem;
          border-radius: 6px;
          margin-top: 0.5rem;
          border: none;
        }

        .amount {
          font-weight: 600;
          color: #1a1a1a;
        }

        .guide-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .guide-item {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .guide-item h5 {
          margin-bottom: 1rem;
          color: #4f46e5;
        }

        .guide-item ul {
          list-style: none;
          padding: 0;
        }

        .guide-item li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          font-size: 0.9rem;
        }

        .guide-item li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #4f46e5;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .bridge-selector {
            flex-direction: column;
          }

          .guide-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
