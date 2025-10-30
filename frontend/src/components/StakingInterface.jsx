import { useState, useEffect } from 'react';
import { Lock, Unlock, Award, Clock } from 'lucide-react';
import { ethers } from 'ethers';
import { TIER_INFO } from '../config-phase2';

export default function StakingInterface({ stakingContract, tokenContract, account }) {
  const [stakeInfo, setStakeInfo] = useState(null);
  const [canClaim, setCanClaim] = useState({ eligible: false, tier: 255 });
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  useEffect(() => {
    if (stakingContract && account) {
      loadStakeInfo();
    }
  }, [stakingContract, account]);

  const loadStakeInfo = async () => {
    try {
      const info = await stakingContract.getStakeInfo(account);
      setStakeInfo({
        amount: info.amount,
        startTime: info.startTime,
        duration: info.duration,
        tier: info.tier,
        claimed: info.claimed,
      });

      const claim = await stakingContract.canClaimBadge(account);
      setCanClaim(claim);
    } catch (error) {
      console.error('Error loading stake info:', error);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    if (!stakeAmount || !tokenContract || !stakingContract) return;

    try {
      setLoading(true);
      setTxStatus(null);

      const amount = ethers.parseUnits(stakeAmount, 18);

      const approveTx = await tokenContract.approve(stakingContract.target, amount);
      setTxStatus({ type: 'pending', message: 'Approving SGT...' });
      await approveTx.wait();

      const stakeTx = await stakingContract.stake(amount);
      setTxStatus({ type: 'pending', message: 'Staking tokens...' });
      await stakeTx.wait();

      setTxStatus({ type: 'success', message: 'Successfully staked!' });
      setStakeAmount('');
      await loadStakeInfo();
    } catch (error) {
      console.error('Stake error:', error);
      setTxStatus({ type: 'error', message: error.reason || 'Staking failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    try {
      setLoading(true);
      setTxStatus(null);

      const tx = await stakingContract.unstake();
      setTxStatus({ type: 'pending', message: 'Unstaking...' });
      await tx.wait();

      setTxStatus({ type: 'success', message: 'Successfully unstaked!' });
      await loadStakeInfo();
    } catch (error) {
      console.error('Unstake error:', error);
      setTxStatus({ type: 'error', message: error.reason || 'Unstaking failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setLoading(true);
      setTxStatus(null);

      const tx = await stakingContract.claimBadge();
      setTxStatus({ type: 'pending', message: 'Minting badge...' });
      const receipt = await tx.wait();

      setTxStatus({ type: 'success', message: 'Badge minted successfully!' });
      await loadStakeInfo();
    } catch (error) {
      console.error('Claim error:', error);
      setTxStatus({ type: 'error', message: error.reason || 'Claim failed' });
    } finally {
      setLoading(false);
    }
  };

  const hasActiveStake = stakeInfo && stakeInfo.amount > 0n;
  const daysStaked = stakeInfo ? Math.floor(Number(stakeInfo.duration) / 86400) : 0;

  return (
    <div className="card">
      <h2 className="card-title">Stake SGT to Earn Badges</h2>

      {!hasActiveStake ? (
        <form onSubmit={handleStake}>
          <div className="form-group">
            <label htmlFor="stakeAmount">Amount to Stake (SGT)</label>
            <input
              type="number"
              id="stakeAmount"
              placeholder="0.0"
              step="0.000000000000000001"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading || !stakeAmount}>
            {loading ? (
              <>
                <div className="loading"></div>
                <span style={{ marginLeft: '0.5rem' }}>Staking...</span>
              </>
            ) : (
              <>
                <Lock size={18} />
                <span style={{ marginLeft: '0.5rem' }}>Stake Tokens</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div>
          <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Staked Amount</div>
              <div className="stat-value">
                {parseFloat(ethers.formatUnits(stakeInfo.amount, 18)).toLocaleString()} SGT
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Days Staked</div>
              <div className="stat-value">{daysStaked} days</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Badge Status</div>
              <div className="stat-value" style={{ fontSize: '1rem' }}>
                {stakeInfo.claimed ? 'Claimed' : 'Not Claimed'}
              </div>
            </div>
          </div>

          {canClaim.eligible && !stakeInfo.claimed && (
            <div style={{ padding: '1rem', background: 'rgba(53, 255, 143, 0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Award size={20} color="var(--accent)" />
                <strong style={{ color: 'var(--accent)' }}>
                  Eligible for {TIER_INFO[canClaim.tier].name} Badge!
                </strong>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                You can now claim your Genesis Badge NFT
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canClaim.eligible && !stakeInfo.claimed && (
              <button onClick={handleClaim} disabled={loading} style={{ flex: 1 }}>
                <Award size={18} />
                <span style={{ marginLeft: '0.5rem' }}>Claim Badge</span>
              </button>
            )}
            <button onClick={handleUnstake} disabled={loading} className="secondary" style={{ flex: 1 }}>
              <Unlock size={18} />
              <span style={{ marginLeft: '0.5rem' }}>Unstake</span>
            </button>
          </div>
        </div>
      )}

      {txStatus && (
        <div className={txStatus.type === 'error' ? 'error-message' : 'success-message'} style={{ marginTop: '1rem' }}>
          {txStatus.message}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Tier Requirements</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {Object.entries(TIER_INFO).map(([tier, info]) => (
            <div
              key={tier}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'var(--bg)',
                borderRadius: '8px',
                borderLeft: `4px solid ${info.color}`,
              }}
            >
              <span style={{ fontWeight: '600' }}>{info.name}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {info.minAmount} SGT × {info.minDays} days
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
