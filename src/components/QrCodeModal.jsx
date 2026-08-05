import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Printer, Scan } from 'lucide-react';

export const QrCodeModal = ({ isOpen, onClose, companyName, companySubtitle }) => {
  if (!isOpen) return null;
  const url = window.location.href;

  const download = () => {
    const canvas = document.querySelector('#aymorix-qr canvas');
    if (canvas) {
      const a = document.createElement('a');
      a.download = 'Aymorix_Review_QR.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ textAlign:'center', position:'relative' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <h3 style={{ fontSize:'1.1rem', fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--text-primary)' }}>
            QR Code Standee
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Print-ready standee card */}
        <div id="aymorix-qr" style={{ background:'linear-gradient(135deg, #050c10, #0a1c28)', border:'1px solid rgba(45,212,191,0.28)', borderRadius:20, padding:'26px 20px', marginBottom:18 }}>
          <div style={{ fontSize:'0.62rem', letterSpacing:'0.22em', color:'#2dd4bf', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
            {companySubtitle}
          </div>
          <div style={{ fontSize:'1.25rem', fontFamily:'var(--font-heading)', fontWeight:800, background:'linear-gradient(135deg,#0d9488,#2dd4bf)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:18 }}>
            {companyName}
          </div>
          <div style={{ background:'white', padding:14, borderRadius:16, display:'inline-block', boxShadow:'0 8px 28px rgba(0,0,0,0.5)', marginBottom:16 }}>
            <QRCodeCanvas value={url} size={168} bgColor="#ffffff" fgColor="#050c10" level="H" />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:'0.87rem', fontWeight:600, color:'#5eead4' }}>
            <Scan size={15} /> Scan to Review &amp; Rate Us
          </div>
          <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', marginTop:5 }}>
            AI-powered · Takes 60 seconds
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button className="btn-secondary" onClick={download}>
            <Download size={15} /> Download PNG
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Print Standee
          </button>
        </div>
      </div>
    </div>
  );
};
