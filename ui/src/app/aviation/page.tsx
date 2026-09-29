"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plane, 
  Wind, 
  AlertTriangle, 
  CheckCircle, 
  Compass, 
  Eye, 
  CloudLightning, 
  ShieldAlert, 
  Navigation 
} from 'lucide-react';

export default function AviationPage() {
  const [selectedAirport, setSelectedAirport] = useState<'VOBL' | 'VIDP' | 'VABB'>('VOBL');

  const airports = {
    'VOBL': {
      code: 'VOBL',
      name: 'Kempegowda International Airport (Bengaluru)',
      metarRaw: 'VOBL 291830Z 25022G38KT 2400 +TSRA SCT012CB BKN025 21/20 Q1011 TEMPO 1200 +TSRA',
      status: 'Warning: Convective Microburst Near Threshold',
      alertLevel: 'Severe',
      diversionRisk: '58%',
      runways: [
        { id: '09L/27R', heading: '090° / 270°', wind: '250° at 22kt G38kt', crosswind: '21 kt', microburst: 'ALERT: -18kt Loss on 3nm Final', status: 'Go-Around Advisory', color: '#ef4444' },
        { id: '09R/27L', heading: '090° / 270°', wind: '240° at 16kt G28kt', crosswind: '14 kt', microburst: 'Nominal Inflow (No Shear)', status: 'Active Departures', color: '#10B981' }
      ],
      waypoints: [
        { name: 'LEKOP (North Gate)', status: 'Closed (CB Cell 60 dBZ)', delay: '+25m' },
        { name: 'GUNIM (East Gate)', status: 'Clear Corridor', delay: 'On-Time' },
        { name: 'TELKO (South Gate)', status: 'Turbulence Advisory', delay: '+10m' },
        { name: 'BIA VOR (Holding Stack)', status: 'Stall Risk: FL140-FL180', delay: 'Holding' }
      ]
    },
    'VIDP': {
      code: 'VIDP',
      name: 'Indira Gandhi International Airport (Delhi)',
      metarRaw: 'VIDP 291800Z 08012KT 4000 HZ FEW040 BKN100 32/22 Q1006 NOSIG',
      status: 'Normal Operations (Haze / VFR Transition)',
      alertLevel: 'Normal',
      diversionRisk: '8%',
      runways: [
        { id: '10/28', heading: '100° / 280°', wind: '080° at 12kt', crosswind: '4 kt', microburst: 'Nominal', status: 'Full Operations', color: '#10B981' },
        { id: '11L/29R', heading: '110° / 290°', wind: '080° at 12kt', crosswind: '6 kt', microburst: 'Nominal', status: 'Full Operations', color: '#10B981' },
        { id: '11R/29L', heading: '110° / 290°', wind: '080° at 12kt', crosswind: '6 kt', microburst: 'Nominal', status: 'Full Operations', color: '#10B981' }
      ],
      waypoints: [
        { name: 'ALI (Holding)', status: 'Normal Flow', delay: 'On-Time' },
        { name: 'DRA (South Gate)', status: 'Normal Flow', delay: 'On-Time' },
        { name: 'DGC (West Gate)', status: 'Clear', delay: 'On-Time' }
      ]
    },
    'VABB': {
      code: 'VABB',
      name: 'Chhatrapati Shivaji Maharaj International (Mumbai)',
      metarRaw: 'VABB 291815Z 27018KT 3000 -RA SCT018 BKN030 27/25 Q1009 TEMPO 1500 SHRA',
      status: 'Monsoon Gusting & Crosswind Alert',
      alertLevel: 'Moderate',
      diversionRisk: '24%',
      runways: [
        { id: '09/27', heading: '090° / 270°', wind: '270° at 18kt', crosswind: '0 kt (Direct Headwind)', microburst: 'Wet Runway Braking Fair', status: 'Active Landing', color: '#10B981' },
        { id: '14/32', heading: '140° / 320°', wind: '270° at 18kt', crosswind: '17 kt Crosswind', microburst: 'Moderate Shear', status: 'Secondary Only', color: '#f59e0b' }
      ],
      waypoints: [
        { name: 'BOM VOR', status: 'Holding Stack FL120', delay: '+15m' },
        { name: 'APANO', status: 'Rainband Crossing', delay: '+10m' },
        { name: 'EXOLU', status: 'Clear Oceanic', delay: 'On-Time' }
      ]
    }
  };

  const current = airports[selectedAirport];

  return (
    <div className="page-container" style={{ maxWidth: '1360px', padding: '36px 28px 80px' }}>
      {/* Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link href="/" className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back to Live Radar Command Center
        </Link>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: current.alertLevel === 'Severe' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)', border: `1px solid ${current.alertLevel === 'Severe' ? '#ef4444' : '#10B981'}`, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: current.alertLevel === 'Severe' ? '#ef4444' : '#10B981', fontWeight: 600 }}>
          <Plane size={14} /> ATC Terminal Weather Radar Sync Active
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Plane size={30} color="var(--color-precip)" /> Aviation Terminal Weather & Runway Safety
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Microburst detection, runway low-level wind shear (LLWS), flight corridor holding stack risk, and live METAR / TAF decoding.
        </p>
      </div>

      {/* Airport Switcher Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {(Object.keys(airports) as Array<keyof typeof airports>).map(code => (
          <button
            key={code}
            onClick={() => setSelectedAirport(code)}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              border: selectedAirport === code ? '1px solid var(--color-precip)' : '1px solid var(--border-color)',
              background: selectedAirport === code ? 'rgba(0, 180, 255, 0.15)' : 'rgba(255,255,255,0.04)',
              color: selectedAirport === code ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: selectedAirport === code ? 'var(--color-precip)' : 'var(--text-primary)' }}>
              {code}
            </span>
            <span style={{ fontSize: '12px' }}>{airports[code].name}</span>
          </button>
        ))}
      </div>

      {/* Airport Status Hero Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', borderLeft: `4px solid ${current.alertLevel === 'Severe' ? '#ef4444' : '#10B981'}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Terminal Area Status</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: current.alertLevel === 'Severe' ? '#ef4444' : 'var(--text-primary)' }}>
              {current.status}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{current.name}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Flight Diversion Probability</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: current.alertLevel === 'Severe' ? '#ef4444' : '#10B981', marginTop: '4px' }}>
              {current.diversionRisk}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Alternate Hub: Chennai VOAA / Hyderabad VOHS</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Low-Level Wind Shear (LLWS)</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
              {current.alertLevel === 'Severe' ? 'CRITICAL (-18kt loss)' : 'NOMINAL (<5kt)'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Doppler Terminal Radar (TDWR) sweep</div>
          </div>
        </div>
      </div>

      {/* Runway Approach Grid */}
      <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Compass size={20} color="var(--color-precip)" /> Runway Approach Corridor & Shear Threat
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {current.runways.map((rwy, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '22px', borderLeft: `4px solid ${rwy.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Runway {rwy.id}</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: rwy.color }}>
                {rwy.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Surface Wind:</span>
                <div style={{ fontWeight: 600 }}>{rwy.wind}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Crosswind:</span>
                <div style={{ fontWeight: 600, color: rwy.crosswind.includes('21') ? '#ef4444' : 'inherit' }}>{rwy.crosswind}</div>
              </div>
            </div>

            <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Microburst / Shear Monitor:</span>
              <span style={{ fontWeight: 'bold', color: rwy.color }}>{rwy.microburst}</span>
            </div>
          </div>
        ))}
      </div>

      {/* METAR Stream & Terminal Waypoint Holding Stack */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Raw & Decoded METAR */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={20} color="#60A5FA" /> Decoded Meteorological Aerodrome Report (METAR)
          </h2>

          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#86efac', marginBottom: '16px' }}>
            {current.metarRaw}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Wind Component:</span>
              <span style={{ fontWeight: 600 }}>250° at 22 knots, Gusts to 38 knots</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Surface Visibility:</span>
              <span style={{ fontWeight: 600, color: '#f59e0b' }}>2,400 meters (Reduced in Heavy Thunderstorm Rain)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Convective Clouds:</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>Cumulonimbus (CB) at 1,200 ft AGL; Overcast 2,500 ft</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Altimeter QNH:</span>
              <span style={{ fontWeight: 600 }}>1011 hPa (29.85 inHg)</span>
            </div>
          </div>
        </div>

        {/* Airspace Holding Waypoints */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={20} color="var(--color-warning)" /> Terminal Airspace Entry Gates
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {current.waypoints.map((wp, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{wp.name}</div>
                  <div style={{ color: wp.status.includes('Closed') || wp.status.includes('Stall') ? '#ef4444' : 'var(--text-secondary)' }}>{wp.status}</div>
                </div>
                <span style={{ fontWeight: 'bold', color: wp.delay.includes('+') || wp.delay === 'Holding' ? '#f59e0b' : '#10B981' }}>
                  {wp.delay}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
