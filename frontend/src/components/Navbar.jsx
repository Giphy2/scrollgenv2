import { Wallet, RefreshCw } from 'lucide-react';

export default function Navbar({ account, onConnect, onDisconnect, isConnecting }) {
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <h1 style={styles.title}>🌀 ScrollGen</h1>
          <span style={styles.subtitle}>Scroll zkEVM Protocol</span>
        </div>

        <div style={styles.actions}>
          {!account ? (
            <button onClick={onConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ marginLeft: '0.5rem' }}>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  <span style={{ marginLeft: '0.5rem' }}>Connect Wallet</span>
                </>
              )}
            </button>
          ) : (
            <div style={styles.connected}>
              <div style={styles.accountInfo}>
                <div style={styles.accountLabel}>Connected</div>
                <div className="address">{shortenAddress(account)}</div>
              </div>
              <button className="secondary" onClick={onDisconnect}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    padding: '1rem 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    background: 'linear-gradient(90deg, var(--primary), var(--accent))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  connected: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  accountLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
};
