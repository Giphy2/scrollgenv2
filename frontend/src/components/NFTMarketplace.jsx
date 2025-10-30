import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ShoppingCart, Tag, TrendingUp, Award, RefreshCw } from 'lucide-react';
import {
  GENESIS_BADGE_ADDRESS,
  MARKETPLACE_ADDRESS,
  NFT_STAKING_ADDRESS,
  GENESIS_BADGE_ABI,
  MARKETPLACE_ABI,
  NFT_STAKING_ABI,
  TIER_INFO
} from '../config-phase2';
import { CONTRACT_ADDRESS as SGT_ADDRESS, TOKEN_ABI } from '../config';

export default function NFTMarketplace({ provider, account }) {
  const [activeView, setActiveView] = useState('marketplace');
  const [listings, setListings] = useState([]);
  const [myNFTs, setMyNFTs] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [stats, setStats] = useState({ totalListings: 0, floorPrice: 0, totalVolume: 0 });

  const badgeContract = provider ? new ethers.Contract(GENESIS_BADGE_ADDRESS, GENESIS_BADGE_ABI, provider) : null;
  const marketplaceContract = provider ? new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider) : null;
  const sgtContract = provider ? new ethers.Contract(SGT_ADDRESS, TOKEN_ABI, provider) : null;

  useEffect(() => {
    if (provider && account) {
      loadData();
    }
  }, [provider, account, activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeView === 'marketplace') {
        await loadMarketplace();
      } else if (activeView === 'myNFTs') {
        await loadMyNFTs();
      } else if (activeView === 'myListings') {
        await loadMyListings();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplace = async () => {
    try {
      const [tokenIds, sellers, prices] = await marketplaceContract.getActiveListings(0, 50);

      const listingsData = await Promise.all(
        tokenIds.map(async (tokenId, index) => {
          try {
            const tier = await badgeContract.getTier(tokenId);
            const tierName = await badgeContract.getTierName(tier);
            return {
              tokenId: tokenId.toString(),
              seller: sellers[index],
              price: ethers.formatEther(prices[index]),
              tier: Number(tier),
              tierName,
              tierInfo: TIER_INFO[Number(tier)],
            };
          } catch (err) {
            console.error(`Error loading token ${tokenId}:`, err);
            return null;
          }
        })
      );

      const validListings = listingsData.filter(l => l !== null);
      setListings(validListings);

      if (validListings.length > 0) {
        const floorPrice = Math.min(...validListings.map(l => parseFloat(l.price)));
        setStats({
          totalListings: validListings.length,
          floorPrice: floorPrice.toFixed(2),
          totalVolume: 0,
        });
      }
    } catch (error) {
      console.error('Error loading marketplace:', error);
      setListings([]);
    }
  };

  const loadMyNFTs = async () => {
    try {
      const tokenIds = await badgeContract.tokensOfOwner(account);

      const nftsData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tier = await badgeContract.getTier(tokenId);
          const tierName = await badgeContract.getTierName(tier);
          const [seller, price, active] = await marketplaceContract.getListing(tokenId);

          return {
            tokenId: tokenId.toString(),
            tier: Number(tier),
            tierName,
            tierInfo: TIER_INFO[Number(tier)],
            isListed: active,
          };
        })
      );

      setMyNFTs(nftsData);
    } catch (error) {
      console.error('Error loading my NFTs:', error);
      setMyNFTs([]);
    }
  };

  const loadMyListings = async () => {
    try {
      const tokenIds = await marketplaceContract.getSellerListings(account);

      const listingsData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const [seller, price, active] = await marketplaceContract.getListing(tokenId);
          const tier = await badgeContract.getTier(tokenId);
          const tierName = await badgeContract.getTierName(tier);

          return {
            tokenId: tokenId.toString(),
            price: ethers.formatEther(price),
            tier: Number(tier),
            tierName,
            tierInfo: TIER_INFO[Number(tier)],
            active,
          };
        })
      );

      setMyListings(listingsData.filter(l => l.active));
    } catch (error) {
      console.error('Error loading my listings:', error);
      setMyListings([]);
    }
  };

  const handleListNFT = async (tokenId) => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const badgeWithSigner = new ethers.Contract(GENESIS_BADGE_ADDRESS, GENESIS_BADGE_ABI, signer);
      const marketplaceWithSigner = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const isApproved = await badgeWithSigner.isApprovedForAll(account, MARKETPLACE_ADDRESS);

      if (!isApproved) {
        const approveTx = await badgeWithSigner.setApprovalForAll(MARKETPLACE_ADDRESS, true);
        await approveTx.wait();
      }

      const priceInWei = ethers.parseEther(listingPrice);
      const tx = await marketplaceWithSigner.listNFT(tokenId, priceInWei);
      await tx.wait();

      alert('NFT listed successfully!');
      setSelectedNFT(null);
      setListingPrice('');
      loadData();
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Failed to list NFT: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNFT = async (tokenId, price) => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const marketplaceWithSigner = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const sgtWithSigner = new ethers.Contract(SGT_ADDRESS, TOKEN_ABI, signer);

      const priceInWei = ethers.parseEther(price);
      const balance = await sgtWithSigner.balanceOf(account);

      if (balance < priceInWei) {
        alert('Insufficient SGT balance');
        return;
      }

      const allowance = await sgtWithSigner.allowance(account, MARKETPLACE_ADDRESS);

      if (allowance < priceInWei) {
        const approveTx = await sgtWithSigner.approve(MARKETPLACE_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      const tx = await marketplaceWithSigner.buyNFT(tokenId);
      await tx.wait();

      alert('NFT purchased successfully!');
      loadData();
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Failed to buy NFT: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelListing = async (tokenId) => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const marketplaceWithSigner = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const tx = await marketplaceWithSigner.cancelListing(tokenId);
      await tx.wait();

      alert('Listing cancelled successfully!');
      loadData();
    } catch (error) {
      console.error('Error cancelling listing:', error);
      alert('Failed to cancel listing: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card">
        <h2 className="card-title">NFT Marketplace</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Connect your wallet to access the marketplace
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={styles.header}>
          <div>
            <h2 className="card-title">NFT Marketplace</h2>
            <p style={styles.subtitle}>Buy and sell Genesis Badges with SGT tokens</p>
          </div>
          <button onClick={loadData} style={styles.refreshButton} disabled={loading}>
            <RefreshCw size={20} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <ShoppingCart size={24} color="var(--accent)" />
            <div>
              <div style={styles.statValue}>{stats.totalListings}</div>
              <div style={styles.statLabel}>Active Listings</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <Tag size={24} color="var(--accent)" />
            <div>
              <div style={styles.statValue}>{stats.floorPrice} SGT</div>
              <div style={styles.statLabel}>Floor Price</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <TrendingUp size={24} color="var(--accent)" />
            <div>
              <div style={styles.statValue}>2.5%</div>
              <div style={styles.statLabel}>Marketplace Fee</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveView('marketplace')}
            style={activeView === 'marketplace' ? styles.tabActive : styles.tabInactive}
          >
            Browse Marketplace
          </button>
          <button
            onClick={() => setActiveView('myNFTs')}
            style={activeView === 'myNFTs' ? styles.tabActive : styles.tabInactive}
          >
            My NFTs
          </button>
          <button
            onClick={() => setActiveView('myListings')}
            style={activeView === 'myListings' ? styles.tabActive : styles.tabInactive}
          >
            My Listings
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loading" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        )}

        {!loading && activeView === 'marketplace' && (
          <div>
            {listings.length === 0 ? (
              <div style={styles.emptyState}>
                <ShoppingCart size={48} color="var(--text-secondary)" />
                <p style={styles.emptyText}>No NFTs listed for sale</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {listings.map((listing) => (
                  <div key={listing.tokenId} style={styles.nftCard}>
                    <div style={{
                      ...styles.nftImage,
                      background: `linear-gradient(135deg, ${listing.tierInfo.color}20, ${listing.tierInfo.color}60)`
                    }}>
                      <Award size={64} color={listing.tierInfo.color} />
                      <div style={{ ...styles.tierBadge, background: listing.tierInfo.color }}>
                        {listing.tierName}
                      </div>
                    </div>
                    <div style={styles.nftInfo}>
                      <h3 style={styles.nftName}>Genesis Badge #{listing.tokenId}</h3>
                      <p style={styles.nftTier}>{listing.tierName} Tier</p>
                      <div style={styles.priceContainer}>
                        <span style={styles.priceLabel}>Price</span>
                        <span style={styles.price}>{listing.price} SGT</span>
                      </div>
                      <p style={styles.seller}>Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</p>
                      {listing.seller.toLowerCase() !== account.toLowerCase() && (
                        <button
                          onClick={() => handleBuyNFT(listing.tokenId, listing.price)}
                          style={styles.buyButton}
                          disabled={loading}
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeView === 'myNFTs' && (
          <div>
            {myNFTs.length === 0 ? (
              <div style={styles.emptyState}>
                <Award size={48} color="var(--text-secondary)" />
                <p style={styles.emptyText}>You don't own any Genesis Badges</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {myNFTs.map((nft) => (
                  <div key={nft.tokenId} style={styles.nftCard}>
                    <div style={{
                      ...styles.nftImage,
                      background: `linear-gradient(135deg, ${nft.tierInfo.color}20, ${nft.tierInfo.color}60)`
                    }}>
                      <Award size={64} color={nft.tierInfo.color} />
                      <div style={{ ...styles.tierBadge, background: nft.tierInfo.color }}>
                        {nft.tierName}
                      </div>
                    </div>
                    <div style={styles.nftInfo}>
                      <h3 style={styles.nftName}>Genesis Badge #{nft.tokenId}</h3>
                      <p style={styles.nftTier}>{nft.tierName} Tier</p>
                      {nft.isListed ? (
                        <div style={styles.listedBadge}>Listed for Sale</div>
                      ) : selectedNFT === nft.tokenId ? (
                        <div style={styles.listForm}>
                          <input
                            type="number"
                            placeholder="Price in SGT"
                            value={listingPrice}
                            onChange={(e) => setListingPrice(e.target.value)}
                            style={styles.priceInput}
                          />
                          <div style={styles.formActions}>
                            <button
                              onClick={() => handleListNFT(nft.tokenId)}
                              style={styles.confirmButton}
                              disabled={loading}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setSelectedNFT(null);
                                setListingPrice('');
                              }}
                              style={styles.cancelButton}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedNFT(nft.tokenId)}
                          style={styles.listButton}
                        >
                          List for Sale
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeView === 'myListings' && (
          <div>
            {myListings.length === 0 ? (
              <div style={styles.emptyState}>
                <Tag size={48} color="var(--text-secondary)" />
                <p style={styles.emptyText}>You have no active listings</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {myListings.map((listing) => (
                  <div key={listing.tokenId} style={styles.nftCard}>
                    <div style={{
                      ...styles.nftImage,
                      background: `linear-gradient(135deg, ${listing.tierInfo.color}20, ${listing.tierInfo.color}60)`
                    }}>
                      <Award size={64} color={listing.tierInfo.color} />
                      <div style={{ ...styles.tierBadge, background: listing.tierInfo.color }}>
                        {listing.tierName}
                      </div>
                    </div>
                    <div style={styles.nftInfo}>
                      <h3 style={styles.nftName}>Genesis Badge #{listing.tokenId}</h3>
                      <p style={styles.nftTier}>{listing.tierName} Tier</p>
                      <div style={styles.priceContainer}>
                        <span style={styles.priceLabel}>Listed Price</span>
                        <span style={styles.price}>{listing.price} SGT</span>
                      </div>
                      <button
                        onClick={() => handleCancelListing(listing.tokenId)}
                        style={styles.cancelListButton}
                        disabled={loading}
                      >
                        Cancel Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
  refreshButton: {
    padding: '0.5rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text)',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid var(--border)',
    marginBottom: '1.5rem',
  },
  tabActive: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--accent)',
    color: 'var(--accent)',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tabInactive: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  nftCard: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  nftImage: {
    position: 'relative',
    aspectRatio: '1',
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
  nftInfo: {
    padding: '1rem',
  },
  nftName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  nftTier: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
  },
  priceContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    marginBottom: '0.75rem',
  },
  priceLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  price: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--accent)',
  },
  seller: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
  },
  buyButton: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  listButton: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelListButton: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--error)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  listedBadge: {
    padding: '0.75rem',
    background: 'var(--success)',
    color: 'white',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '600',
  },
  listForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  priceInput: {
    padding: '0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '1rem',
    background: 'var(--bg)',
    color: 'var(--text)',
  },
  formActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  confirmButton: {
    flex: 1,
    padding: '0.75rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    background: 'var(--bg-secondary)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  emptyText: {
    fontSize: '1.125rem',
    marginTop: '1rem',
    color: 'var(--text-secondary)',
  },
};
