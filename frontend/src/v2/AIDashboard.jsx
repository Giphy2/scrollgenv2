import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Brain, TrendingUp, AlertTriangle, Zap, RefreshCw, Target } from 'lucide-react';
import {
  AI_YIELD_MANAGER_ADDRESS,
  AI_YIELD_MANAGER_ABI,
} from '../config-phase5';

export default function AIDashboard({ provider, account }) {
  const [pools, setPools] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetAPY, setTargetAPY] = useState('15');
  const [maxVolatility, setMaxVolatility] = useState('50');
  const [autoRebalance, setAutoRebalance] = useState(false);

  const aiContract = provider && AI_YIELD_MANAGER_ADDRESS
    ? new ethers.Contract(AI_YIELD_MANAGER_ADDRESS, AI_YIELD_MANAGER_ABI, provider)
    : null;

  useEffect(() => {
    if (provider && account && aiContract) {
      loadData();
    }
  }, [provider, account]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPools(), loadStrategy(), loadProposals()]);
    } catch (error) {
      console.error('Error loading AI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPools = async () => {
    try {
      const activePoolAddresses = await aiContract.getActivePools();
      const poolsData = await Promise.all(
        activePoolAddresses.map(async (poolAddr) => {
          const [apy, liquidity, volatility, lastUpdate, active] = await aiContract.getPoolMetrics(poolAddr);
          return {
            address: poolAddr,
            apy: Number(apy) / 100,
            liquidity: ethers.formatEther(liquidity),
            volatility: Number(volatility) / 100,
            lastUpdate: Number(lastUpdate),
            active,
          };
        })
      );
      setPools(poolsData);
    } catch (error) {
      console.error('Error loading pools:', error);
      setPools([]);
    }
  };

  const loadStrategy = async () => {
    try {
      const [targetAPY, maxVol, minLiq, autoReb] = await aiContract.getUserStrategy(account);
      if (Number(targetAPY) > 0) {
        setStrategy({
          targetAPY: Number(targetAPY) / 100,
          maxVolatility: Number(maxVol) / 100,
          minLiquidity: ethers.formatEther(minLiq),
          autoRebalance: autoReb,
        });
      }
    } catch (error) {
      console.error('Error loading strategy:', error);
    }
  };

  const loadProposals = async () => {
    setProposals([]);
  };

  const handleSetStrategy = async () => {
    if (!targetAPY || !maxVolatility) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const aiWithSigner = new ethers.Contract(AI_YIELD_MANAGER_ADDRESS, AI_YIELD_MANAGER_ABI, signer);

      const tx = await aiWithSigner.setUserStrategy(
        Math.floor(parseFloat(targetAPY) * 100),
        Math.floor(parseFloat(maxVolatility) * 100),
        ethers.parseEther('1000'),
        autoRebalance
      );
      await tx.wait();

      alert('AI strategy set successfully!');
      loadData();
    } catch (error) {
      console.error('Error setting strategy:', error);
      alert('Failed to set strategy: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card">
        <h2 className="card-title">AI Yield Copilot</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Connect your wallet to access AI-powered yield optimization
        </p>
      </div>
    );
  }

  if (!AI_YIELD_MANAGER_ADDRESS) {
    return (
      <div className="card">
        <h2 className="card-title">AI Yield Copilot</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          AI Yield Manager not deployed yet. Coming soon!
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
              <Brain size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              AI Yield Copilot
            </h2>
            <p style={styles.subtitle}>AI-powered yield optimization and risk management</p>
          </div>
          <button onClick={loadData} style={styles.refreshButton} disabled={loading}>
            <RefreshCw size={20} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {strategy && (
          <div style={styles.strategyCard}>
            <h3 style={styles.sectionTitle}>
              <Target size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Active Strategy
            </h3>
            <div style={styles.strategyGrid}>
              <div>
                <div style={styles.label}>Target APY</div>
                <div style={styles.value}>{strategy.targetAPY}%</div>
              </div>
              <div>
                <div style={styles.label}>Max Volatility</div>
                <div style={styles.value}>{strategy.maxVolatility}%</div>
              </div>
              <div>
                <div style={styles.label}>Auto-Rebalance</div>
                <div style={styles.value}>{strategy.autoRebalance ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">Set AI Strategy</h3>
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Target APY (%)</label>
            <input
              type="number"
              value={targetAPY}
              onChange={(e) => setTargetAPY(e.target.value)}
              placeholder="15"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Max Volatility (%)</label>
            <input
              type="number"
              value={maxVolatility}
              onChange={(e) => setMaxVolatility(e.target.value)}
              placeholder="50"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={autoRebalance}
                onChange={(e) => setAutoRebalance(e.target.checked)}
                style={styles.checkbox}
              />
              Enable Auto-Rebalance
            </label>
          </div>
          <button onClick={handleSetStrategy} disabled={loading} style={styles.button}>
            {loading ? 'Setting...' : 'Set Strategy'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <TrendingUp size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Available Pools
        </h3>
        {pools.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No pools available
          </p>
        ) : (
          <div style={styles.poolsGrid}>
            {pools.map((pool, index) => (
              <div key={index} style={styles.poolCard}>
                <div style={styles.poolHeader}>
                  <div style={styles.poolAddress}>{pool.address.slice(0, 10)}...{pool.address.slice(-8)}</div>
                  <div style={styles.badge}>{pool.active ? 'Active' : 'Inactive'}</div>
                </div>
                <div style={styles.poolStats}>
                  <div>
                    <div style={styles.statLabel}>APY</div>
                    <div style={styles.statValue}>{pool.apy.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div style={styles.statLabel}>Liquidity</div>
                    <div style={styles.statValue}>{parseFloat(pool.liquidity).toFixed(0)} SGT</div>
                  </div>
                  <div>
                    <div style={styles.statLabel}>Volatility</div>
                    <div style={styles.statValue}>{pool.volatility.toFixed(1)}%</div>
                  </div>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyCard: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
  },
  strategyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  },
  label: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  value: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
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
  input: {
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
  poolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  poolCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '1rem',
  },
  poolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  poolAddress: {
    fontSize: '0.9rem',
    fontFamily: 'monospace',
    color: 'var(--text-primary)',
  },
  badge: {
    padding: '0.25rem 0.5rem',
    background: 'var(--success)',
    color: 'white',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  poolStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
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
};
