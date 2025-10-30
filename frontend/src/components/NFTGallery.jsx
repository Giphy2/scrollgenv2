import { useState, useEffect } from 'react';
import { Image, Award, ExternalLink } from 'lucide-react';
import { TIER_INFO } from '../config-phase2';

export default function NFTGallery({ badgeContract, account, onListNFT }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (badgeContract && account) {
      loadBadges();
    }
  }, [badgeContract, account]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const tokenIds = await badgeContract.tokensOfOwner(account);

      const badgeData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tier = await badgeContract.getTier(tokenId);
          const tierName = await badgeContract.getTierName(tier);
          const uri = await badgeContract.tokenURI(tokenId);

          return {
            tokenId: tokenId.toString(),
            tier: Number(tier),
            tierName,
            uri,
            tierInfo: TIER_INFO[Number(tier)],
          };
        })
      );

      setBadges(badgeData);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="card-title">Your Genesis Badges</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your badges...</p>
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">Your Genesis Badges</h2>
        <div style={styles.emptyState}>
          <Award size={48} color="var(--text-secondary)" />
          <p style={styles.emptyText}>You don't own any Genesis Badges yet</p>
          <p style={styles.emptySubtext}>Stake SGT tokens to earn your first badge!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="card-title">Your Genesis Badges ({badges.length})</h2>
      </div>

      <div style={styles.grid}>
        {badges.map((badge) => (
          <div key={badge.tokenId} style={styles.badgeCard}>
            <div style={styles.badgeImageContainer}>
              <div style={{
                ...styles.badgeImage,
                background: `linear-gradient(135deg, ${badge.tierInfo.color}20, ${badge.tierInfo.color}60)`
              }}>
                <Award size={64} color={badge.tierInfo.color} />
              </div>
              <div style={{
                ...styles.tierBadge,
                background: badge.tierInfo.color
              }}>
                {badge.tierName}
              </div>
            </div>

            <div style={styles.badgeInfo}>
              <h3 style={styles.badgeName}>Genesis Badge #{badge.tokenId}</h3>
              <p style={styles.badgeTier}>{badge.tierName} Tier</p>

              <div style={styles.badgeStats}>
                <div>
                  <span style={styles.statLabel}>Min Stake:</span>
                  <span style={styles.statValue}>{badge.tierInfo.minAmount} SGT</span>
                </div>
                <div>
                  <span style={styles.statLabel}>Min Duration:</span>
                  <span style={styles.statValue}>{badge.tierInfo.minDays} days</span>
                </div>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => onListNFT && onListNFT(badge.tokenId)}
                  style={styles.actionButton}
                >
                  List for Sale
                </button>
                <a
                  href={`https://sepolia.scrollscan.com/token/${badgeContract.target}?a=${badge.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkButton}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  badgeCard: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  badgeImageContainer: {
    position: 'relative',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--bg)',
    textTransform: 'uppercase',
  },
  badgeInfo: {
    padding: '1rem',
  },
  badgeName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  badgeTier: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
  },
  badgeStats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    padding: '0.75rem',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  statValue: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--accent)',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionButton: {
    flex: 1,
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
  },
  linkButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  emptyText: {
    fontSize: '1.125rem',
    marginTop: '1rem',
    color: 'var(--text)',
  },
  emptySubtext: {
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    color: 'var(--text-secondary)',
  },
};
