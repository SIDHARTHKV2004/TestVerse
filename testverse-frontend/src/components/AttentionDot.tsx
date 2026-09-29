import React from 'react';

interface AttentionDotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AttentionDot: React.FC<AttentionDotProps> = ({ className = '', size = 'md' }) => {
  const sizeClass =
    size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <span
      className={`attention-indicator-dot ${sizeClass} ${className}`}
      title="Attention required"
      aria-label="Attention indicator"
    />
  );
};

export default AttentionDot;
