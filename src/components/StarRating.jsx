import React, { useState } from 'react';
import { Star, Sparkles } from 'lucide-react';

const LABELS = {
  1: 'Poor 😞',
  2: 'Fair 😐',
  3: 'Good 🙂',
  4: 'Very Good 😊',
  5: 'Outstanding 🌟'
};

export const StarRating = ({ rating, onChange }) => {
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return (
    <div className="stars-wrapper">
      <div className="stars-header-caption">
        Click to Rate (1-5)
      </div>

      <div className="stars-row">
        {[1, 2, 3, 4, 5].map(s => {
          const filled = s <= active;
          return (
            <button
              key={s}
              type="button"
              className="star-btn"
              onClick={() => onChange(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${s} star`}
            >
              <Star
                size={40}
                fill={filled ? 'url(#goldGrad)' : 'none'}
                stroke={filled ? '#d97706' : 'rgba(148, 163, 184, 0.5)'}
                strokeWidth={1.5}
                style={{
                  filter: filled
                    ? 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.65))'
                    : 'none',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Gold SVG Gradient definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
        </defs>
      </svg>

      <div className="stars-sub-caption">
        {active ? `${LABELS[active]} (${active}/5)` : 'Tap stars to set overall rating'}
      </div>
    </div>
  );
};
