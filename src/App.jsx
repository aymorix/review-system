import React, { useState, useEffect } from 'react';
import { ReviewForm }    from './components/ReviewForm';
import { SuccessModal }  from './components/SuccessModal';
import { QrCodeModal }   from './components/QrCodeModal';
import { AymorixLogo }   from './components/AymorixLogo';
import { getStoredConfig } from './services/storageService';
import {
  Sun, Moon, ShieldCheck, Sparkles
} from 'lucide-react';

export default function App() {
  const [config] = useState(getStoredConfig());
  const [theme,  setTheme]  = useState('light');

  const [showSuccess,  setShowSuccess]  = useState(false);
  const [showQr,       setShowQr]       = useState(false);

  const [reviewComment, setReviewComment] = useState('');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [submitted,     setSubmitted]     = useState({ reviewText: '', rating: 5 });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <>
      {/* Dynamic Ambient Background Glows */}
      <div className="bg-glow-container">
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

        {/* Top Title Bar */}
        <div className="top-page-title">
          Rate &amp; Review
        </div>

        {/* Central Phone Mockup Container Card */}
        <div className="phone-card-wrapper">

          {/* Header Dark Banner */}
          <header className="app-header-banner">
            {/* Top-right icon controls */}
            <div className="header-controls">
              <button className="icon-btn" onClick={toggleTheme} title="Toggle Light/Dark Mode">
                {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />}
              </button>
            </div>

            {/* Brand Logo & Name */}
            <div className="header-brand-row">
              <div className="header-logo-icon">
                <AymorixLogo size={44} />
              </div>
              <div className="header-brand-text">
                <h1 className="header-company-name">AYMORIX TECHNOLOGIES</h1>
                <div className="header-company-sub">Software Systems</div>
              </div>
            </div>
          </header>

          {/* Main Form Body */}
          <main className="app-main-body">
            <ReviewForm
              config={config}
              onOpenSuccess={d => { setSubmitted(d); setShowSuccess(true); }}
              isAiGenerated={isAiGenerated}
              setIsAiGenerated={setIsAiGenerated}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
            />
          </main>
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="var(--brand-primary)" />
            Official Feedback Portal • {config.companyName || 'Aymorix Technologies'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} color="var(--brand-primary)" />
            Powered by Automated Sheets Sync &amp; AI Engine
          </div>
        </footer>

        {/* Modals */}
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          reviewText={submitted.reviewText}
          rating={submitted.rating}
          googleReviewUrl={config.googleReviewUrl}
        />
        <QrCodeModal
          isOpen={showQr}
          onClose={() => setShowQr(false)}
          companyName={config.companyName || "AYMORIX TECHNOLOGIES"}
          companySubtitle="SOFTWARE SYSTEMS"
        />
      </div>
    </>
  );
}
