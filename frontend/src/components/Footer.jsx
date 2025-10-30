import { Github, BookOpen, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.left}>
          <p style={styles.text}>
            Built on <span style={styles.highlight}>Scroll zkEVM</span>
          </p>
          <p style={styles.subtext}>Multi-Phase zkEVM Protocol</p>
        </div>

        <div style={styles.links}>
          <a href="#" style={styles.link} title="Documentation">
            <BookOpen size={20} />
          </a>
          <a href="#" style={styles.link} title="GitHub">
            <Github size={20} />
          </a>
          <a href="#" style={styles.link} title="Twitter">
            <Twitter size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border)',
    padding: '1.5rem 0',
    marginTop: 'auto',
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
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  text: {
    color: 'var(--text)',
    fontSize: '0.875rem',
  },
  subtext: {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
  },
  highlight: {
    color: 'var(--accent)',
    fontWeight: '600',
  },
  links: {
    display: 'flex',
    gap: '1rem',
  },
  link: {
    color: 'var(--text-secondary)',
    transition: 'color 0.2s',
    cursor: 'pointer',
  },
};
