"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Thermometer, 
  Wind, 
  CloudRain, 
  Compass, 
  Gauge, 
  Activity, 
  AlertOctagon, 
  Layers, 
  ChevronRight 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ThermodynamicsPage() {
  const [activeStation, setActiveStation] = useState<'blr-sounding' | 'del-sounding' | 'mum-sounding'>('blr-sounding');

  const soundingProfiles = [
    { pressure: 1000, altitude: 0.9, temp: 28.4, dewpoint: 23.2, parcel: 28.4 },
    { pressure: 925, altitude: 1.5, temp: 22.8, dewpoint: 20.1, parcel: 24.2 },
    { pressure: 850, altitude: 2.2, temp: 18.0, dewpoint: 16.5, parcel: 20.8 },
    { pressure: 700, altitude: 3.8, temp: 9.4, dewpoint: 6.2, parcel: 14.5 },
    { pressure: 500, altitude: 6.2, temp: -5.8, dewpoint: -11.2, parcel: 2.6 },
    { pressure: 400, altitude: 7.8, temp: -16.5, dewpoint: -24.0, parcel: -8.1 },
    { pressure: 300, altitude: 9.8, temp: -32.0, dewpoint: -42.0, parcel: -24.2 },
    { pressure: 250, altitude: 11.2, temp: -42.5, dewpoint: -55.0, parcel: -36.0 },
    { pressure: 200, altitude: 12.8, temp: -54.0, dewpoint: -68.0, parcel: -52.4 },
    { pressure: 150, altitude: 14.6, temp: -66.5, dewpoint: -79.0, parcel: -67.8 },
    { pressure: 100, altitude: 16.8, temp: -74.2, dewpoint: -88.0, parcel: -82.0 },
  ];

  const indices = [
    { name: 'SBCAPE', value: '1,850 J/kg', desc: 'Surface-Based Convective Available Potential Energy', severity: 'Extreme', color: '#ef4444' },
    { name: 'MUCAPE', value: '2,240 J/kg', desc: 'Most Unstable Parcel Buoyant Energy', severity: 'Extreme', color: '#ef4444' },
    { name: 'CIN', value: '-18 J/kg', desc: 'Convective Inhibition (Inversion Cap broken)', severity: 'Favorable', color: '#10B981' },
    { name: 'Lifted Index (LI)', value: '-6.4', desc: '500 hPa Parcel Thermal Deficit', severity: 'Severe', color: '#ef4444' },
    { name: '0-6km Bulk Shear', value: '42 knots', desc: 'Deep Layer Wind Shear for Storm Organization', severity: 'High', color: '#f59e0b' },
    { name: 'SRH 0-3km', value: '210 m²/s²', desc: 'Storm Relative Helicity (Mesocyclone Potential)', severity: 'Severe', color: '#ef4444' },
    { name: 'K-Index', value: '38.5', desc: 'Air-Mass Thunderstorm Potential', severity: 'High', color: '#f59e0b' },
    { name: 'PWAT', value: '58.2 mm', desc: 'Precipitable Water Vapor in Atmospheric Column', severity: 'Torrential', color: '#3B82F6' },
  ];

  const verticalLevels = [
    { level: 'EL (Equilibrium Level)', hpa: '165 hPa', alt: '13.8 km', desc: 'Storm Anvil / Overshooting Convective Top' },
    { level: 'Freezing Level (0°C Isotherm)', hpa: '580 hPa', alt: '4.8 km', desc: 'Hail Growth Zone & Melting Layer Bright Band' },
    { level: 'LFC (Level of Free Convection)', hpa: '840 hPa', alt: '1.6 km', desc: 'Spontaneous Updraft Acceleration Level' },
    { level: 'LCL (Lifted Condensation Level)', hpa: '920 hPa', alt: '0.8 km', desc: 'Cloud Base / Ground Moisture Saturation' },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1360px', padding: '36px 28px 80px' }}>
      {/* Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link href="/" className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back to Live Radar Command Center
        </Link>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-severe)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: '#ff6b6b', fontWeight: 600 }}>
          <AlertOctagon size={14} /> Severe Convective Instability Active
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Thermometer size={30} color="#f59e0b" /> Vertical Atmospheric Soundings & Thermodynamics
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Deep-column thermodynamic profile (Skew-T Log-P) and kinematic wind shear analysis driving VAJRA convective initiation nowcasts.
        </p>
      </div>

      {/* Station Selector Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
        {[
          { id: 'blr-sounding', label: 'Bengaluru (DWR / Radiosonde 43295)', status: 'CAPE: 1850 J/kg' },
          { id: 'del-sounding', label: 'Delhi-NCR (Safdarjung 42182)', status: 'CAPE: 1200 J/kg' },
          { id: 'mum-sounding', label: 'Mumbai (Santacruz 43003)', status: 'CAPE: 2400 J/kg' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => setActiveStation(st.id as any)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: activeStation === st.id ? '1px solid var(--color-precip)' : '1px solid var(--border-color)',
              background: activeStation === st.id ? 'rgba(0, 180, 255, 0.15)' : 'rgba(255,255,255,0.04)',
              color: activeStation === st.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{st.label}</span>
            <span style={{ fontSize: '11px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              {st.status}
            </span>
          </button>
        ))}
      </div>

      {/* Top Main Section: Skew-T Sounding Profile Chart + Critical Levels */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Sounding Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="var(--color-precip)" /> Skew-T Vertical Atmospheric Column Profile
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Pressure Altitude (1000 hPa to 100 hPa) vs. Temperature, Dewpoint & Convective Parcel Ascent
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }} /> Temp (T)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
                <span style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '2px' }} /> Dewpoint (Td)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                <span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }} /> Parcel Path (CAPE)
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={soundingProfiles}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="temp" stroke="var(--text-secondary)" fontSize={11} label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -5, fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis dataKey="pressure" stroke="var(--text-secondary)" fontSize={11} reversed={true} domain={[100, 1000]} label={{ value: 'Pressure (hPa)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
              <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} name="Air Temp (°C)" />
              <Line type="monotone" dataKey="dewpoint" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} name="Dewpoint (°C)" />
              <Line type="monotone" dataKey="parcel" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Rising Parcel (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Critical Convective Levels */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--color-warning)" /> Critical Boundary Layers
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {verticalLevels.map((lvl, idx) => (
              <div key={idx} style={{ padding: '12px', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', borderLeft: '3px solid var(--color-precip)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{lvl.level}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-precip)', fontWeight: 'bold' }}>
                    {lvl.hpa} &bull; {lvl.alt}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {lvl.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Severe Instability Scorecard Grid */}
      <h2 style={{ fontSize: '20px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Gauge size={22} color="var(--color-severe)" /> Severe Thunderstorm & Convective Indices
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {indices.map((ind, i) => (
          <div key={i} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>{ind.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: ind.color }}>
                  {ind.severity}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {ind.desc}
              </p>
            </div>

            <div style={{ fontSize: '24px', fontWeight: 'bold', color: ind.color, marginTop: '16px' }}>
              {ind.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
