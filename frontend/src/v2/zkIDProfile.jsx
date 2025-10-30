import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Shield, Star, Activity, Award } from 'lucide-react';
import { ZKID_VERIFIER_ADDRESS, ZKID_VERIFIER_ABI, VERIFICATION_LEVELS } from '../config-phase5';

export default function zkIDProfile({ provider, account }) {
  const [identity, setIdentity] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const zkidContract = provider && ZKID_VERIFIER_ADDRESS
    ? new ethers.Contract(ZKID_VERIFIER_ADDRESS, ZKID_VERIFIER_ABI, provider)
    : null;

  useEffect(() => {
    if (provider && account && zkidContract) {
      loadData();
    }
  }, [provider, account]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sp, level, lastUpdate, verified] = await zkidContract.getIdentity(account);
      if (verified) {
        setIdentity({
          scrollPower: Number(sp),
          level: Number(level),
          lastUpdate: Number(lastUpdate),
          verified,
        });

        const [total, consistency, contribution, governance, trust] = await zkidContract.getReputation(account);
        setReputation({
          total: Number(total),
          consistency: Number(consistency),
          contribution: Number(contribution),
          governance: Number(governance),
          trust: Number(trust),
        });

        const acts = await zkidContract.getUserActivities(account);
        setActivities(acts.map(a => ({
          type: a.activityType,
          reward: Number(a.spReward),
          timestamp: Number(a.timestamp),
          claimed: a.claimed,
        })));
      }
    } catch (error) {
      console.error('Error loading zkID:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card">
        <h2 className="card-title">zkID Profile</h2>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Connect wallet to view zkID profile
        </p>
      </div>
    );
  }

  if (!ZKID_VERIFIER_ADDRESS) {
    return (
      <div className="card">
        <h2 className="card-title">zkID Profile</h2>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          zkID Verifier not deployed yet. Coming soon!
        </p>
      </div>
    );
  }

  if (!identity || !identity.verified) {
    return (
      <div className="card">
        <h2 className="card-title">zkID Profile</h2>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Not verified yet. Complete verification to access zkID features.
        </p>
      </div>
    );
  }

  const levelInfo = VERIFICATION_LEVELS[identity.level] || VERIFICATION_LEVELS[1];

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">
          <Shield size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          zkID Profile
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', padding: '1.5rem', background: `linear-gradient(135deg, ${levelInfo.color}20, ${levelInfo.color}40)`, borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ScrollPower</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: levelInfo.color, marginTop: '0.5rem' }}>{identity.scrollPower}</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{levelInfo.name} Level</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={20} /> Reputation Scores
            </h3>
            {reputation && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Consistency:</span> <strong>{reputation.consistency}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Contribution:</span> <strong>{reputation.contribution}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Governance:</span> <strong>{reputation.governance}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Trust:</span> <strong>{reputation.trust}</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <Activity size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Recent Activities
        </h3>
        {activities.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No activities yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.slice(0, 10).map((act, i) => (
              <div key={i} style={{ padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{act.type}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(act.timestamp * 1000).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} color="var(--accent)" />
                  <span style={{ fontWeight: '600', color: 'var(--accent)' }}>+{act.reward} SP</span>
                  {act.claimed && <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--success)', color: 'white', borderRadius: '0.25rem' }}>Claimed</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
