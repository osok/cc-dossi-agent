interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Error display banner with optional retry and dismiss actions.
 */
export default function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div style={{
      padding: 'var(--space-3) var(--space-4)',
      background: 'rgba(139, 0, 0, 0.08)',
      border: '1px solid var(--color-classified)',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-typewriter)',
      fontSize: 'var(--text-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
    }}>
      <span style={{ color: 'var(--color-classified)' }}>{message}</span>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              fontFamily: 'var(--font-typewriter)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-1) var(--space-2)',
              background: 'var(--color-paper-light)',
              border: '1px solid var(--color-paper-edge)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              fontFamily: 'var(--font-typewriter)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-1) var(--space-2)',
              background: 'transparent',
              border: '1px solid var(--color-paper-edge)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
