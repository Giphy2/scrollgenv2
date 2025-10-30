import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, TOKEN_ABI } from '../config.js';
import {
  STAKING_REWARDS_ADDRESS,
  STAKING_REWARDS_ABI,
  LOCK_DURATIONS,
  MULTIPLIERS,
  formatLockDuration,
  formatMultiplier,
} from '../config-phase3.js';

export default function StakingUI({ provider, account }) {
  const [amount, setAmount] = useState('');
  const [lockDuration, setLockDuration] = useState(LOCK_DURATIONS.FLEXIBLE);
  const [autoCompound, setAutoCompound] = useState(false);
  const [stakes, setStakes] = useState([]);
  const [stats, setStats] = useState({ totalStaked: '0', rewardRate: '0', earned: '0' });
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  useEffect(() => {
    if (provider && account) {
      loadStakingData();
    }
  }, [provider, account]);

  const loadStakingData = async () => {
    try {
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(STAKING_REWARDS_ADDRESS, STAKING_REWARDS_ABI, signer);

      const [userStakes, totalStaked, rewardRate, earned] = await Promise.all([
        stakingContract.getUserStakes(account),
        stakingContract.totalStaked(),
        stakingContract.rewardRate(),
        stakingContract.earned(account),
      ]);

      setStakes(userStakes.map((stake, index) => ({
        index,
        amount: ethers.formatUnits(stake.amount, 18),
        startTime: new Date(Number(stake.startTime) * 1000),
        lockDuration: Number(stake.lockDuration),
        autoCompound: stake.autoCompound,
        multiplier: Number(stake.multiplier),
      })));

      setStats({
        totalStaked: ethers.formatUnits(totalStaked, 18),
        rewardRate: ethers.formatUnits(rewardRate, 18),
        earned: ethers.formatUnits(earned, 18),
      });
    } catch (error) {
      console.error('Error loading staking data:', error);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setTxStatus('❌ Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setTxStatus('Approving SGT...');

      const signer = await provider.getSigner();
      const sgtContract = new ethers.Contract(CONTRACT_ADDRESS, TOKEN_ABI, signer);
      const stakingContract = new ethers.Contract(STAKING_REWARDS_ADDRESS, STAKING_REWARDS_ABI, signer);

      const stakeAmount = ethers.parseUnits(amount, 18);

      const approveTx = await sgtContract.approve(STAKING_REWARDS_ADDRESS, stakeAmount);
      await approveTx.wait();

      setTxStatus('Staking tokens...');
      const stakeTx = await stakingContract.stake(stakeAmount, lockDuration, autoCompound);
      await stakeTx.wait();

      setTxStatus('✅ Staked successfully!');
      setAmount('');
      await loadStakingData();

      setTimeout(() => setTxStatus(''), 3000);
    } catch (error) {
      console.error('Staking error:', error);
      setTxStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (stakeIndex) => {
    try {
      setLoading(true);
      setTxStatus(`Unstaking position ${stakeIndex}...`);

      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(STAKING_REWARDS_ADDRESS, STAKING_REWARDS_ABI, signer);

      const tx = await stakingContract.unstake(stakeIndex);
      await tx.wait();

      setTxStatus('✅ Unstaked successfully!');
      await loadStakingData();

      setTimeout(() => setTxStatus(''), 3000);
    } catch (error) {
      console.error('Unstaking error:', error);
      setTxStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      setLoading(true);
      setTxStatus('Claiming rewards...');

      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(STAKING_REWARDS_ADDRESS, STAKING_REWARDS_ABI, signer);

      const tx = await stakingContract.claimRewards();
      await tx.wait();

      setTxStatus('✅ Rewards claimed!');
      await loadStakingData();

      setTimeout(() => setTxStatus(''), 3000);
    } catch (error) {
      console.error('Claim error:', error);
      setTxStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (stake) => {
    const unlockTime = stake.startTime.getTime() + (stake.lockDuration * 1000);
    return Date.now() >= unlockTime;
  };

  return (
    <div className="staking-container">
      <h2>🔒 Stake SGT Tokens</h2>

      <div className="staking-stats">
        <div className="stat-card">
          <div className="stat-label">Total Staked</div>
          <div className="stat-value">{parseFloat(stats.totalStaked).toLocaleString()} SGT</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Your Rewards</div>
          <div className="stat-value">{parseFloat(stats.earned).toFixed(4)} SGT</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reward Rate</div>
          <div className="stat-value">{parseFloat(stats.rewardRate).toFixed(6)}/block</div>
        </div>
      </div>

      <div className="staking-form">
        <h3>New Stake</h3>
        <form onSubmit={handleStake}>
          <div className="form-group">
            <label>Amount (SGT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              min="100"
              disabled={loading}
            />
            <div className="input-hint">Minimum: 100 SGT</div>
          </div>

          <div className="form-group">
            <label>Lock Duration</label>
            <select
              value={lockDuration}
              onChange={(e) => setLockDuration(Number(e.target.value))}
              disabled={loading}
            >
              {Object.entries(LOCK_DURATIONS).map(([key, value]) => (
                <option key={key} value={value}>
                  {formatLockDuration(value)} - {formatMultiplier(MULTIPLIERS[value])} Rewards
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoCompound}
                onChange={(e) => setAutoCompound(e.target.checked)}
                disabled={loading}
              />
              Enable Auto-Compound
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Stake Tokens'}
          </button>
        </form>

        {txStatus && <div className="tx-status">{txStatus}</div>}
      </div>

      <div className="stakes-list">
        <div className="list-header">
          <h3>Your Stakes</h3>
          {parseFloat(stats.earned) > 0 && (
            <button onClick={handleClaimRewards} className="btn-secondary" disabled={loading}>
              Claim All Rewards
            </button>
          )}
        </div>

        {stakes.length === 0 ? (
          <div className="empty-state">No active stakes</div>
        ) : (
          <div className="stakes-grid">
            {stakes.map((stake) => (
              <div key={stake.index} className="stake-card">
                <div className="stake-header">
                  <div className="stake-amount">{parseFloat(stake.amount).toLocaleString()} SGT</div>
                  <div className="stake-multiplier">{formatMultiplier(stake.multiplier)}</div>
                </div>
                <div className="stake-details">
                  <div className="detail-row">
                    <span>Lock Duration:</span>
                    <span>{formatLockDuration(stake.lockDuration)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Started:</span>
                    <span>{stake.startTime.toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>Auto-Compound:</span>
                    <span>{stake.autoCompound ? '✅ Yes' : '❌ No'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span className={isUnlocked(stake) ? 'unlocked' : 'locked'}>
                      {isUnlocked(stake) ? '🔓 Unlocked' : '🔒 Locked'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnstake(stake.index)}
                  className="btn-unstake"
                  disabled={loading || !isUnlocked(stake)}
                >
                  {isUnlocked(stake) ? 'Unstake' : 'Still Locked'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .staking-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
        }

        .staking-stats {
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

        .staking-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        .staking-form h3 {
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

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }

        .input-hint {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .btn-primary,
        .btn-secondary,
        .btn-unstake {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
          width: 100%;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338ca;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #10b981;
          color: white;
        }

        .btn-unstake {
          background: #ef4444;
          color: white;
          width: 100%;
          margin-top: 1rem;
        }

        .tx-status {
          margin-top: 1rem;
          padding: 1rem;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
        }

        .stakes-list {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .stakes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .stake-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          background: #f9fafb;
        }

        .stake-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .stake-amount {
          font-size: 1.3rem;
          font-weight: bold;
        }

        .stake-multiplier {
          background: #4f46e5;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.9rem;
        }

        .stake-details {
          margin-bottom: 1rem;
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

        .unlocked {
          color: #10b981;
        }

        .locked {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}
