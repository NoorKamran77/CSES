import React from 'react';

export default function VerdictBadge({ status }) {
  const getBadgeStyle = (st) => {
    switch (st) {
      case 'Accepted':
        return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
      case 'Wrong Answer':
        return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' };
      case 'Time Limit Exceeded':
        return { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' };
      case 'Memory Limit Exceeded':
        return { bg: '#fbe9e7', text: '#d84315', border: '#ffab91' };
      case 'Compilation Error':
        return { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' };
      case 'Runtime Error':
        return { bg: '#fce4ec', text: '#c2185b', border: '#f48fb1' };
      case 'Compiling':
      case 'Running':
        return { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9', animated: true };
      case 'Queued':
      case 'Pending':
      default:
        return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0', animated: true };
    }
  };

  const style = getBadgeStyle(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {style.animated && (
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: style.text,
            display: 'inline-block',
            animation: 'pulse 1.2s infinite ease-in-out',
          }}
        />
      )}
      {status || 'Pending'}
    </span>
  );
}

