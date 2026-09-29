"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldAlert, 
  AlertTriangle, 
  Send, 
  Download, 
  CheckCircle2, 
  LifeBuoy, 
  Building2, 
  Radio, 
  Layers, 
  MapPin, 
  FileText 
} from 'lucide-react';

export default function DisasterOps() {
  const [selectedWard, setSelectedWard] = useState<string>('ward-150');
  const [capCopied, setCapCopied] = useState<boolean>(false);
  const [alertDispatched, setAlertDispatched] = useState<boolean>(false);

  const wardData = [
    { id: 'ward-150', name: 'Bellandur (Ward 150)', risk: 92, level: 'Critical', rainRate: '78 mm/hr', floodDepth: '1.4 m', underpasses: 'Waterlogged', pumps: '5/6 Active', siren: 'Armed' },
    { id: 'ward-174', name: 'Silk Board Junction (Ward 174)', risk: 88, level: 'Critical', rainRate: '65 mm/hr', floodDepth: '1.1 m', underpasses: 'Diverted', pumps: '4/4 Active', siren: 'Armed' },
    { id: 'ward-151', name: 'Koramangala 4th Block (Ward 151)', risk: 79, level: 'High', rainRate: '54 mm/hr', floodDepth: '0.8 m', underpasses: 'Slowed', pumps: '3/3 Active', siren: 'Standby' },
    { id: 'ward-007', name: 'Hebbal Flyover Corridor (Ward 7)', risk: 74, level: 'High', rainRate: '48 mm/hr', floodDepth: '0.6 m', underpasses: 'Clear', pumps: '2/2 Active', siren: 'Standby' },
    { id: 'ward-085', name: 'Whitefield - ITPL Corridor (Ward 85)', risk: 58, level: 'Moderate', rainRate: '32 mm/hr', floodDepth: '0.3 m', underpasses: 'Clear', pumps: '1/2 Active', siren: 'Standby' },
    { id: 'ward-003', name: 'Yelahanka Lake Basin (Ward 3)', risk: 36, level: 'Low', rainRate: '19 mm/hr', floodDepth: '0.1 m', underpasses: 'Clear', pumps: '0/1 Active', siren: 'Standby' },
  ];

  const infrastructureAssets = [
    { name: 'Namma Metro Purple Line', type: 'Transit', status: 'Operational', impact: 'Track sensors nominal; 0.2m runoff at Indiranagar station sump' },
    { name: 'Kempegowda Airport Expressway (NH44)', type: 'Highway', status: 'Hydroplane Alert', impact: 'Speed reduced to 50 km/h between Yelahanka & Devanahalli' },
    { name: 'BESCOM 66kV Substation (Koramangala)', type: 'Power Grid', status: 'Pump Active', impact: 'Automated flood barrier deployed; 0.4m below critical busbar' },
    { name: 'Victoria & Bowring Hospital Access', type: 'Healthcare', status: 'Priority Corridor', impact: 'Designated alternate emergency routes active via MG Road' }
  ];

  const capXmlSnippet = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>VAJRA-NOWCAST-${new Date().toISOString().slice(0, 10)}-004</identifier>
  <sender>imd-nowcast@vajra.gov.in</sender>
  <sent>${new Date().toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>Severe Thunderstorm & Flash Flood</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <headline>Level 4 Convective Deluge & Microburst Expected over Central Bengaluru</headline>
    <description>Doppler radar echo >65 dBZ detected with cyclonic velocity signature. Rainfall exceeding 75mm/hr in Bellandur & Silk Board sectors within 25 minutes.</description>
    <area>
      <areaDesc>Bengaluru Urban (BBMP East & South Zones)</areaDesc>
      <circle>12.9716,77.5946,18.0</circle>
    </area>
  </info>
</alert>`;

  const copyCap = () => {
    navigator.clipboard.writeText(capXmlSnippet);
    setCapCopied(true);
    setTimeout(() => setCapCopied(false), 2500);
  };

  const dispatchAlert = () => {
    setAlertDispatched(true);
    setTimeout(() => setAlertDispatched(false), 4000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1360px', padding: '36px 28px 80px' }}>
      {/* Top Nav Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link href="/" className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back to Live Radar Command Center
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--color-severe)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: '#ff6b6b', fontWeight: 600 }}>
            <Radio size={14} className="pulse-indicator" style={{ background: '#ef4444' }} /> NDRF Sector 4 Armed
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
            <CheckCircle2 size={14} /> BBMP Flood Cells Online
          </span>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={32} color="var(--color-severe)" /> Municipal Disaster Operations & Civil Defense
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Direct translation of radar nowcasts into ward-level flood vulnerability, infrastructure defense alerts, and Common Alerting Protocol (CAP v1.2) emergency broadcasts.
        </p>
      </div>

      {/* Key Metric Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-severe)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Vulnerability Wards</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-severe)', marginTop: '6px' }}>4 Wards</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Bellandur, Silk Board, Koramangala, Hebbal</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Inflow Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-warning)', marginTop: '6px' }}>78 mm/hr</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Exceeds storm water drain retention threshold</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>De-Watering Pumps</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60A5FA', marginTop: '6px' }}>15 / 18 Active</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>3 Mobile emergency tractor pumps in transit</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warning Lead Time</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10B981', marginTop: '6px' }}>+48 Mins</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Civil defense advance evacuation window</div>
        </div>
      </div>

      {/* Main Grid: Ward Table + Critical Assets */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Ward-Level Vulnerability Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--color-precip)" /> Ward Flood Vulnerability Matrix
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 8px' }}>Ward</th>
                  <th style={{ padding: '10px 8px' }}>Risk Index</th>
                  <th style={{ padding: '10px 8px' }}>Rain Inflow</th>
                  <th style={{ padding: '10px 8px' }}>Est. Water Level</th>
                  <th style={{ padding: '10px 8px' }}>Underpasses</th>
                  <th style={{ padding: '10px 8px' }}>Pumps</th>
                </tr>
              </thead>
              <tbody>
                {wardData.map(ward => (
                  <tr 
                    key={ward.id} 
                    onClick={() => setSelectedWard(ward.id)}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)', 
                      cursor: 'pointer',
                      background: selectedWard === ward.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{ward.name}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        background: ward.risk > 80 ? 'rgba(239, 68, 68, 0.2)' : ward.risk > 60 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: ward.risk > 80 ? '#ef4444' : ward.risk > 60 ? '#f59e0b' : '#10B981'
                      }}>
                        {ward.risk}% &bull; {ward.level}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{ward.rainRate}</td>
                    <td style={{ padding: '12px 8px', color: ward.floodDepth.startsWith('1') ? '#ef4444' : 'var(--text-primary)', fontWeight: 600 }}>
                      {ward.floodDepth}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{ward.underpasses}</td>
                    <td style={{ padding: '12px 8px', color: '#60A5FA' }}>{ward.pumps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Infrastructure Exposure */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--color-warning)" /> Critical Asset Exposure
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {infrastructureAssets.map((asset, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', borderLeft: '3px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{asset.name}</span>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                    {asset.type}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: asset.status.includes('Alert') ? '#f59e0b' : '#10B981', fontWeight: 600, marginBottom: '4px' }}>
                  &bull; {asset.status}
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {asset.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CAP Protocol & Broadcast Actions */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={20} color="#10B981" /> Common Alerting Protocol (CAP v1.2) Automated Emergency Feed
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Standardized XML payload ingested by National Disaster Management Authority (NDMA) & Integrated Public Alert Warning System (IPAWS).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={copyCap}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <FileText size={15} /> {capCopied ? "Copied XML!" : "Copy CAP XML"}
            </button>

            <button 
              onClick={dispatchAlert}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: alertDispatched ? '#10B981' : 'var(--color-severe)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
            >
              <Send size={15} /> {alertDispatched ? "Broadcast Dispatched via SMS Gateway!" : "Broadcast Public Cell Alert"}
            </button>
          </div>
        </div>

        <pre style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#86efac',
          fontFamily: 'monospace',
          overflowX: 'auto',
          maxHeight: '220px',
          margin: 0
        }}>
          {capXmlSnippet}
        </pre>
      </div>
    </div>
  );
}
