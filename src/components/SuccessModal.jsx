import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2, Copy, Star, ExternalLink, X
} from 'lucide-react';
import { formatGoogleReviewUrl } from '../services/storageService';

export const SuccessModal = ({ isOpen, reviewText, rating, googleReviewUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    confetti({
      particleCount: 90, spread: 75, origin: { y: 0.55 },
      colors: ['#1847F0', '#2563eb', '#38bdf8', '#60a5fa', '#ffffff']
    });
    if (reviewText?.trim()) {
      navigator.clipboard?.writeText(reviewText).then(() => setCopied(true)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copy = () => {
    navigator.clipboard?.writeText(reviewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ position:'relative' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:18, right:18, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex' }}>
          <X size={20} />
        </button>

        {/* Success icon */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ width:70, height:70, borderRadius:'50%', background:'rgba(24,71,240,0.1)', border:'2px solid rgba(24,71,240,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <CheckCircle2 size={36} color="#1847F0" strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize:'1.3rem', fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>
            Feedback Recorded!
          </h2>
        </div>

        {/* Stars */}
        <div style={{ display:'flex', justifyContent:'center', gap:5, marginBottom:18 }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={20}
              fill={s <= rating ? '#1847F0' : 'none'}
              stroke={s <= rating ? '#1847F0' : 'var(--text-muted)'}
              strokeWidth={1.8}
              style={{ filter: s <= rating ? 'drop-shadow(0 0 5px rgba(24,71,240,0.5))' : 'none' }}
            />
          ))}
        </div>

        {/* Review clipboard block */}
        <div style={{ background:'rgba(24,71,240,0.06)', border:'1px solid rgba(24,71,240,0.18)', borderRadius:14, padding:16, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#1847F0', letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:5 }}>
              <Copy size={12} /> Copied to Clipboard
            </span>
            {copied && (
              <span style={{ fontSize:'0.7rem', background:'rgba(24,71,240,0.18)', color:'#1847F0', padding:'2px 9px', borderRadius:20, fontWeight:700 }}>
                ✓ Copied
              </span>
            )}
          </div>
          <p style={{ fontSize:'0.87rem', color:'var(--text-primary)', lineHeight:1.5, fontStyle:'italic', marginBottom:10 }}>
            "{reviewText}"
          </p>
          <button onClick={copy} style={{ background:'none', border:'none', color:'var(--text-secondary)', fontSize:'0.76rem', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Copy size={13} /> Tap to copy again
          </button>
        </div>

        {/* Steps */}
        <p style={{ fontSize:'0.84rem', fontWeight:700, color:'var(--text-primary)', textAlign:'center', marginBottom:12 }}>
          Now post it on Google Reviews
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {[
            'Google Review page will open in new tab',
            'Long-press the text box → tap Paste',
            'Select your star rating → tap Post'
          ].map((step, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.82rem', color:'var(--text-secondary)' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(24,71,240,0.1)', border:'1px solid rgba(24,71,240,0.22)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.72rem', fontWeight:700, color:'#1847F0' }}>
                {i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href={formatGoogleReviewUrl(googleReviewUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            marginBottom: 10,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <Star size={17} fill="currentColor" strokeWidth={0} />
          <span>Post on Google Reviews</span>
          <ExternalLink size={16} style={{ marginLeft: 'auto' }} />
        </a>

        <button onClick={onClose} className="btn-secondary" style={{ width:'100%', justifyContent:'center' }}>
          Submit Another Review
        </button>

      </div>
    </div>
  );
};
