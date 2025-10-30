import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Layers, Users, Award, TrendingUp, RefreshCw } from 'lucide-react';
import {
  RESTAKE_HUB_ADDRESS,
  RESTAKE_HUB_ABI,
} from '../config-phase5';
import { CONTRACT_ADDRESS as SGT_ADDRESS, TOKEN_ABI } from '../config';

export default function RestakingPortal({ provider, account }) {
  const [operators, setOperators] = useState([]);
  const [myRestakings, setMyRestakings] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [restakeAmount, setRestakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSGT, setUseSGT] = useState(true);

  const restakeContract = provider && RESTAKE_HUB_ADDRESS
    ? new ethers.Contract(RESTAKE_HUB_ADDRESS, RESTAKE_HUB_ABI, provider)
    : null;

  useEffect(() => {
    if (provider && account && restakeContract) {
      loadData();
    }
  }, [provider, account]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadOperators(), loadMyRestakings()]);
    } catch (error) {
      console.error('Error loading restaking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOperators = async () => {
    try {
      const activeOps = await restakeContract.getActiveOperators();
      const operatorsData = await Promise.all(
        activeOps.map(async (opAddr) => {
          const [name, commission, totalRestaked, maxCapacity, reputation, uptime, active] =
            await restakeContract.getOperatorInfo(opAddr);
          return {
            address: opAddr,
            name,
            commission: Number(commission) / 100,
            totalRestaked: ethers.formatEther(totalRestaked),
            maxCapacity: ethers.formatEther(maxCapacity),
            reputation: Number(reputation),
            uptime: Number(uptime),
            active,
          };
        })
      );
      setOperators(operatorsData);
    } catch (error) {
      console.error('Error loading operators:', error);
      setOperators([]);
    }
  };

  const loadMyRestakings = async () => {
    try {
      const restakings = await restakeContract.getUserRestakings(account);
      const restakingsData = restakings
        .map((r, index) => ({
          index,
          operator: r.operator,
          amount: ethers.formatEther(r.amount),
          startTime: Number(r.startTime),
          rewardsAccrued: ethers.formatEther(r.rewardsAccrued),
          active: r.active,
        }))
        .filter(r => r.active);
      setMyRestakings(restakingsData);
    } catch (error) {
      console.error('Error loading restakings:', error);
      setMyRestakings([]);
    }
  };

  const handleRestake = async () => {
    if (!selectedOperator || !restakeAmount || parseFloat(restakeAmount) <= 0) {
      alert('Please select operator and enter amount');
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const restakeWithSigner = new ethers.Contract(RESTAKE_HUB_ADDRESS, RESTAKE_HUB_ABI, signer);
      const sgtWithSigner = new ethers.Contract(SGT_ADDRESS, TOKEN_ABI, signer);

      const amount = ethers.parseEther(restakeAmount);
      const allowance = await sgtWithSigner.allowance(account, RESTAKE_HUB_ADDRESS);

      if (allowance < amount) {
        const approveTx = await sgtWithSigner.approve(RESTAKE_HUB_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      const tx = await restakeWithSigner.restake(selectedOperator, amount, useSGT);
      await tx.wait();

      alert('Restaked successfully!');
      setRestakeAmount('');
      setSelectedOperator('');
      loadData();
    } catch (error) {
      console.error('Error restaking:', error);
      alert('Failed to restake: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUnrestake = async (index) => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const restakeWithSigner = new ethers.Contract(RESTAKE_HUB_ADDRESS, RESTAKE_HUB_ABI, signer);

      const tx = await restakeWithSigner.unrestake(index);
      await tx.wait();

      alert('Unrestaked successfully!');
      loadData();
    } catch (error) {
      console.error('Error unrestaking:', error);
      alert('Failed to unrestake: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async (index) => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const restakeWithSigner = new ethers.Contract(RESTAKE_HUB_ADDRESS, RESTAKE_HUB_ABI, signer);

      const tx = await restakeWithSigner.claimRewards(index);
      await tx.wait();

      alert('Rewards claimed successfully!');
      loadData();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card">
        <h2 className="card-title">Restaking Portal</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Connect your wallet to access restaking
        </p>
      </div>
    );
  }

  if (!RESTAKE_HUB_ADDRESS) {
    return (
      <div className="card">
        <h2 className="card-title">Restaking Portal</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Restake Hub not deployed yet. Coming soon!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={styles.header}>
          <div>
            <h2 className="card-title">
              <Layers size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Restaking Portal
            </h2>
            <p style={styles.subtitle}>Earn additional yield by restaking your SGT tokens</p>
          </div>
          <button onClick={loadData} style={styles.refreshButton} disabled={loading}>
            <RefreshCw size={20} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Operator</label>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              style={styles.select}
            >
              <option value="">Choose operator...</option>
              {operators.map((op) => (
                <option key={op.address} value={op.address}>
                  {op.name} - {op.commission}% commission - {op.uptime}% uptime
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount to Restake</label>
            <input
              type="number"
              value={restakeAmount}
              onChange={(e) => setRestakeAmount(e.target.value)}
              placeholder="100"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={useSGT}
                onChange={(e) => setUseSGT(e.target.checked)}
                style={styles.checkbox}
              />
              Use SGT (uncheck for sSGT)
            </label>
          </div>

          <button onClick={handleRestake} disabled={loading} style={styles.button}>
            {loading ? 'Processing...' : 'Restake'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <Users size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Active Operators
        </h3>
        {operators.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No operators available
          </p>
        ) : (
          <div style={styles.operatorsGrid}>
            {operators.map((op) => (
              <div key={op.address} style={styles.operatorCard}>
                <div style={styles.operatorHeader}>
                  <h4 style={styles.operatorName}>{op.name}</h4>
                  <div style={styles.reputation}>
                    <Award size={16} />
                    {op.reputation}
                  </div>
                </div>
                <div style={styles.operatorStats}>
                  <div>
                    <div style={styles.statLabel}>Commission</div>
                    <div style={styles.statValue}>{op.commission}%</div>
                  </div>
                  <div>
                    <div style={styles.statLabel}>Uptime</div>
                    <div style={styles.statValue}>{op.uptime}%</div>
                  </div>
                  <div>
                    <div style={styles.statLabel}>Total Restaked</div>
                    <div style={styles.statValue}>{parseFloat(op.totalRestaked).toFixed(0)}</div>
                  </div>
                  <div>
                    <div style={styles.statLabel}>Capacity</div>
                    <div style={styles.statValue}>
                      {((parseFloat(op.totalRestaked) / parseFloat(op.maxCapacity)) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <TrendingUp size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          My Restakings
        </h3>
        {myRestakings.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No active restakings
          </p>
        ) : (
          <div style={styles.restakingsGrid}>
            {myRestakings.map((r) => (
              <div key={r.index} style={styles.restakingCard}>
                <div style={styles.restakingInfo}>
                  <div>
                    <div style={styles.label}>Operator</div>
                    <div style={styles.value}>{r.operator.slice(0, 10)}...{r.operator.slice(-8)}</div>
                  </div>
                  <div>
                    <div style={styles.label}>Amount</div>
                    <div style={styles.value}>{parseFloat(r.amount).toFixed(2)} SGT</div>
                  </div>
                  <div>
                    <div style={styles.label}>Rewards</div>
                    <div style={styles.value}>{parseFloat(r.rewardsAccrued).toFixed(4)} SGT</div>
                  </div>
                </div>
                <div style={styles.restakingActions}>
                  <button onClick={() => handleClaimRewards(r.index)} disabled={loading} style={styles.actionButton}>
                    Claim
                  </button>
                  <button onClick={() => handleUnrestake(r.index)} disabled={loading} style={styles.actionButtonDanger}>
                    Unrestake
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  },
  refreshButton: {
    padding: '0.5rem',
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  },
  select: {
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '1.25rem',
    height: '1.25rem',
    cursor: 'pointer',
  },
  button: {
    padding: '0.75rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  operatorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  operatorCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '1rem',
  },
  operatorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  operatorName: {
    fontSize: '1.1rem',
    margin: 0,
  },
  reputation: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    background: 'var(--accent)',
    color: 'white',
    borderRadius: '0.25rem',
    fontSize: '0.85rem',
  },
  operatorStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--accent)',
  },
  restakingsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  restakingCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '1rem',
  },
  restakingInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  value: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  restakingActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionButton: {
    flex: 1,
    padding: '0.5rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  actionButtonDanger: {
    flex: 1,
    padding: '0.5rem',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
};
