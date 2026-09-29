"use client";
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CloudLightning, Droplets } from 'lucide-react';

export default function Alerts() {
  return (
    <div className="page-container">
      <Link href="/" className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>
      
      <h1>Active Alerts</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Live AI Nowcast Warnings for Bengaluru Urban / South Grid</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        <div className="alert-card severe glass-panel" style={{ padding: '24px' }}>
          <div className="alert-header">
            <CloudLightning size={24} color="var(--color-severe)" />
            <h3 style={{ fontSize: '20px', color: 'var(--color-severe)' }}>Tornadic Vortex Signature</h3>
          </div>
          <p style={{ fontSize: '16px' }}>Level 3 Severe &bull; 94% Confidence</p>
          <p style={{ marginTop: '8px' }}>DeepNowcast model detects severe convective cell #89 approaching from WNW. Peak gusts estimated at 102 km/h.</p>
          <div className="eta" style={{ fontSize: '18px' }}>ETA: 18 mins (Impact expected at 15:52 IST)</div>
        </div>

        <div className="alert-card warning glass-panel" style={{ padding: '24px' }}>
          <div className="alert-header">
            <Droplets size={24} color="var(--color-warning)" />
            <h3 style={{ fontSize: '20px', color: 'var(--color-warning)' }}>Precipitation Surge</h3>
          </div>
          <p style={{ fontSize: '16px' }}>Level 2 Warning &bull; 87% Confidence</p>
          <p style={{ marginTop: '8px' }}>Flash flood conditions likely in low-lying areas of Sector 4. Estimated rainfall rate: +42mm/hr.</p>
          <div className="eta" style={{ fontSize: '18px', color: 'var(--color-warning)' }}>ETA: 45 mins</div>
        </div>
      </div>
    </div>
  );
}
