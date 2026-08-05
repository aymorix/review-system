import React from 'react';

export const AymorixLogo = ({ size = 46, className = '' }) => (
  <div
    className={className}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: '2px solid #ffffff',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000000',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      flexShrink: 0
    }}
  >
    <img
      src="/official-aymorix-logo.png"
      alt="Aymorix Logo"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scale(1.36)',
        borderRadius: '50%',
        display: 'block'
      }}
    />
  </div>
);
