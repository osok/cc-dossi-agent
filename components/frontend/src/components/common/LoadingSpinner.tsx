import styles from './Badge.module.css';

interface LoadingSpinnerProps {
  message?: string;
}

/**
 * Loading indicator with typewriter-styled message.
 */
export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      fontFamily: 'var(--font-typewriter)',
      color: 'var(--color-ink-faded)',
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '2px solid var(--color-paper-edge)',
        borderTopColor: 'var(--color-ink-faded)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: 'var(--space-4)',
      }} />
      <p>{message}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
