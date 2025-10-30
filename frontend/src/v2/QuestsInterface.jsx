import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Target, Trophy, Zap, CheckCircle } from 'lucide-react';
import { QUEST_SYSTEM_ADDRESS, QUEST_SYSTEM_ABI, BADGE_TIERS } from '../config-phase5';

export default function QuestsInterface({ provider, account }) {
  const [quests, setQuests] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const questContract = provider && QUEST_SYSTEM_ADDRESS
    ? new ethers.Contract(QUEST_SYSTEM_ADDRESS, QUEST_SYSTEM_ABI, provider)
    : null;

  useEffect(() => {
    if (provider && account && questContract) {
      loadData();
    }
  }, [provider, account]);

  const loadData = async () => {
    setLoading(true);
    try {
      const activeQuestIds = await questContract.getActiveQuests();
      const questsData = await Promise.all(
        activeQuestIds.map(async (qid) => {
          const [name, desc, required, reward, active, participants, completions] = await questContract.getQuest(qid);
          const [progress, req, completed, claimed] = await questContract.getUserQuestProgress(account, qid);
          return {
            id: Number(qid),
            name,
            description: desc,
            required: Number(required),
            reward: Number(reward),
            participants: Number(participants),
            completions: Number(completions),
            myProgress: Number(progress),
            completed,
            claimed,
          };
        })
      );
      setQuests(questsData);

      const badgeIds = await questContract.getUserBadges(account);
      const badgesData = await Promise.all(
        badgeIds.map(async (bid) => {
          const [name, tier, exp, level, mintTime] = await questContract.getBadge(bid);
          return {
            id: Number(bid),
            name,
            tier: Number(tier),
            exp: Number(exp),
            level: Number(level),
            mintTime: Number(mintTime),
          };
        })
      );
      setMyBadges(badgesData);

      const [completed, total, highestTier, totalExp] = await questContract.getUserStats(account);
      setStats({
        completed: Number(completed),
        total: Number(total),
        highestTier: Number(highestTier),
        totalExp: Number(totalExp),
      });
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuest = async (questId) => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const questWithSigner = new ethers.Contract(QUEST_SYSTEM_ADDRESS, QUEST_SYSTEM_ABI, signer);
      const tx = await questWithSigner.startQuest(questId);
      await tx.wait();
      alert('Quest started!');
      loadData();
    } catch (error) {
      console.error('Error starting quest:', error);
      alert('Failed: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBadge = async (questId) => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const questWithSigner = new ethers.Contract(QUEST_SYSTEM_ADDRESS, QUEST_SYSTEM_ABI, signer);
      const tx = await questWithSigner.claimBadge(questId);
      await tx.wait();
      alert('Badge claimed!');
      loadData();
    } catch (error) {
      console.error('Error claiming badge:', error);
      alert('Failed: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card">
        <h2 className="card-title">Quests & Achievements</h2>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Connect wallet to view quests
        </p>
      </div>
    );
  }

  if (!QUEST_SYSTEM_ADDRESS) {
    return (
      <div className="card">
        <h2 className="card-title">Quests & Achievements</h2>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Quest System not deployed yet. Coming soon!
        </p>
      </div>
    );
  }

  return (
    <div>
      {stats && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="card-title">
            <Trophy size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Your Achievements
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)' }}>{stats.completed}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quests Completed</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)' }}>{stats.total}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Badges</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: BADGE_TIERS[stats.highestTier]?.color || 'var(--accent)' }}>
                {BADGE_TIERS[stats.highestTier]?.name || 'None'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Highest Tier</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--card-bg)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)' }}>{stats.totalExp}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total XP</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <Target size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Active Quests
        </h3>
        {quests.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No quests available</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {quests.map((q) => (
              <div key={q.id} style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>{q.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{q.description}</p>
                  </div>
                  {q.completed && !q.claimed && (
                    <CheckCircle size={24} color="var(--success)" />
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span>Progress: {q.myProgress} / {q.required}</span>
                    <span>{((q.myProgress / q.required) * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((q.myProgress / q.required) * 100, 100)}%`, background: 'var(--accent)', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {q.participants} participants • {q.completions} completed
                  </div>
                  {q.myProgress === 0 && (
                    <button onClick={() => handleStartQuest(q.id)} disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                      Start Quest
                    </button>
                  )}
                  {q.completed && !q.claimed && (
                    <button onClick={() => handleClaimBadge(q.id)} disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                      Claim Badge
                    </button>
                  )}
                  {q.claimed && (
                    <span style={{ padding: '0.5rem 1rem', background: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem' }}>Claimed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <Zap size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          My Badges
        </h3>
        {myBadges.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No badges yet. Complete quests to earn badges!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {myBadges.map((b) => {
              const tierInfo = BADGE_TIERS[b.tier] || BADGE_TIERS[1];
              return (
                <div key={b.id} style={{ padding: '1.5rem', background: `linear-gradient(135deg, ${tierInfo.color}20, ${tierInfo.glow}20)`, border: `2px solid ${tierInfo.color}`, borderRadius: '0.75rem', textAlign: 'center' }}>
                  <Trophy size={48} color={tierInfo.color} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{b.name}</div>
                  <div style={{ fontSize: '0.85rem', color: tierInfo.color, marginBottom: '0.5rem' }}>{tierInfo.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Level {b.level} • {b.exp} XP</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
