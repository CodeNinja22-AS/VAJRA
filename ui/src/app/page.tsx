"use client";
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Search, AlertTriangle, Wind, Droplets, Activity, Settings, Clock, CloudLightning, Terminal } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { theme } = useTheme();
  const [timeIdx, setTimeIdx] = useState(0);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const windCanvasRef = useRef<HTMLCanvasElement>(null);

  const [precipitationData, setPrecipitationData] = useState([
    { time: 'T-30m', amount: 0, confidence: 100 },
    { time: 'T-15m', amount: 2, confidence: 100 },
    { time: 'NOW', amount: 15, confidence: 100 },
    { time: 'T+15m', amount: 45, confidence: 95 },
    { time: 'T+30m', amount: 30, confidence: 85 },
    { time: 'T+45m', amount: 10, confidence: 75 },
    { time: 'T+60m', amount: 0, confidence: 65 },
  ]);


  const [showTerminal, setShowTerminal] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [mapLayerType, setMapLayerType] = useState<'radar' | 'satellite'>('radar');

  const [telemetry, setTelemetry] = useState({
    temp: 28.4,
    humidity: 78,
    wind: 28,
    aqi: 68,
    cape: 1200, // Convective Available Potential Energy (J/kg)
    windShear: 35 // knots
  });

  const [validationMetrics] = useState({
    csi: 0.82, // Critical Success Index
    far: 0.14  // False Alarm Ratio
  });

  useEffect(() => {
    if (!showTerminal) return;
    const logMessages = [
      "Dask Scheduler: Received Zarr array block [2048x2048]",
      "Worker 0: Allocating 4GB VRAM on GPU 0",
      "Worker 1: Computing spatial convolutions...",
      "MLOps: Model weights synced from MLflow registry",
      "Dask: Task graph compiled. 1420 tasks pending",
      "Worker 2: Evicting memory to host. 98% utilization",
      "Inference Engine: Forward pass complete in 42ms",
      "Pipeline: Nowcast generation successful. Merging outputs..."
    ];
    
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = `[${new Date().toISOString().split('T')[1].slice(0,11)}] ${logMessages[Math.floor(Math.random() * logMessages.length)]}`;
        const updated = [...prev, newLog];
        return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
      });
    }, 600);
    
    return () => clearInterval(interval);
  }, [showTerminal]);

  useEffect(() => {
    if (showTerminal && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showTerminal]);

  const [alerts, setAlerts] = useState([
    {
      title: "Tornadic Vortex Signature",
      level: "Level 3 Severe",
      confidence: 94,
      eta: 18
    },
    {
      title: "Precipitation Surge",
      desc: "+42mm/hr expected in Sector 4"
    }
  ]);

  const API_BASE = process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const mapboxToken = process.env.NEXT_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    // 1. Fetch Backend Data
    const fetchData = () => {
      fetch(`${API_BASE}/api/nowcast`)
        .then(res => {
          if (!res.ok) throw new Error("Backend not connected");
          return res.json();
        })
        .then(data => {
          if (data) {
            if (data.precipitation) setPrecipitationData(data.precipitation);
            if (data.telemetry) setTelemetry(data.telemetry);
            if (data.alerts) setAlerts(data.alerts);
          }
        })
        .catch(err => console.log("Using mock data because Python backend is not reachable yet."));
    };

    fetchData();
    // Refresh every 5 seconds to show dynamic updates
    const interval = setInterval(fetchData, 5000);

    // 2. Initialize Mapbox
    const token = mapboxToken;
    if (!token || token === 'your_mapbox_token_here') return () => clearInterval(interval);

    mapboxgl.accessToken = token;

    if (map.current) return () => clearInterval(interval);

    if (mapContainer.current) {
      try {
        console.log("Initializing Mapbox with token: ", token.substring(0, 10) + "...");
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
          center: [77.5946, 12.9716], // Bengaluru coordinates
          zoom: 11.5,
          pitch: 65,
          bearing: -20,
          antialias: true
        });

        map.current.on('load', () => {
          console.log("Mapbox loaded successfully");

          // Add 3D Terrain
          map.current?.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          map.current?.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

          // Add Sky Layer
          map.current?.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 0.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });

          // Insert 3D buildings beneath symbols
          const layers = map.current?.getStyle()?.layers;
          let labelLayerId;
          if (layers) {
            for (const layer of layers) {
              if (layer.type === 'symbol' && layer.layout && (layer.layout as Record<string, any>)?.['text-field']) {
                labelLayerId = layer.id;
                break;
              }
            }
          }

          map.current?.addLayer(
            {
              'id': 'add-3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 11,
              'paint': {
                'fill-extrusion-color': theme === 'dark' ? '#1f2937' : '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  11,
                  0,
                  11.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  11,
                  0,
                  11.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.8
              }
            },
            labelLayerId
          );

          // Add radar source mapping the Bengaluru bounding box
          map.current?.addSource('radar', {
            type: 'image',
            url: `${API_BASE}/api/radar/frame/${timeIdx}`,
            coordinates: [
              [77.4, 13.2], // Top left (lon, lat)
              [77.8, 13.2], // Top right
              [77.8, 12.8], // Bottom right
              [77.4, 12.8]  // Bottom left
            ]
          });

          map.current?.addLayer({
            id: 'radar-layer',
            type: 'raster',
            source: 'radar',
            paint: {
              'raster-opacity': 0.75,
              'raster-fade-duration': 0
            }
          });

          // Interactive Sector Drill-Down
          map.current?.on('click', (e) => {
            // Update telemetry with mock "microscopic" data based on click
            setTelemetry({
              temp: parseFloat((24 + Math.random() * 8).toFixed(1)),
              humidity: Math.floor(65 + Math.random() * 30),
              wind: Math.floor(10 + Math.random() * 35),
              aqi: Math.floor(45 + Math.random() * 80),
              cape: Math.floor(800 + Math.random() * 2000),
              windShear: Math.floor(15 + Math.random() * 45)
            });
            
            // Update precipitation to simulate localized forecast
            setPrecipitationData([
              { time: 'T-30m', amount: Math.floor(Math.random() * 10), confidence: 100 },
              { time: 'T-15m', amount: Math.floor(Math.random() * 20), confidence: 100 },
              { time: 'NOW', amount: Math.floor(Math.random() * 50), confidence: 100 },
              { time: 'T+15m', amount: Math.floor(Math.random() * 60), confidence: 96 },
              { time: 'T+30m', amount: Math.floor(Math.random() * 40), confidence: 82 },
              { time: 'T+45m', amount: Math.floor(Math.random() * 20), confidence: 68 },
              { time: 'T+60m', amount: Math.floor(Math.random() * 5), confidence: 55 },
            ]);
            
            // Add a temporary marker to show where they clicked
            const marker = new mapboxgl.Marker({ color: 'var(--color-severe)' })
              .setLngLat(e.lngLat)
              .addTo(map.current!);
              
            setTimeout(() => marker.remove(), 2000); // Remove after 2s
          });
        });

        map.current.on('error', (e) => {
          console.error("Mapbox Error:", e);
        });
      } catch (err) {
        console.error("Failed to initialize Mapbox:", err);
      }
    }

    return () => {
      clearInterval(interval);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [theme]); // Re-render map style when theme changes

  // Update radar image when timeIdx changes
  useEffect(() => {
    if (map.current && map.current.getSource('radar')) {
      const source = map.current.getSource('radar') as mapboxgl.ImageSource;
      source.updateImage({
        url: `${API_BASE}/api/radar/frame/${timeIdx}`
      });
    }
  }, [timeIdx]);

  useEffect(() => {
    if (!map.current) return;
    const isSat = mapLayerType === 'satellite';
    
    if (map.current.getLayer('radar-layer')) {
      map.current.setPaintProperty('radar-layer', 'raster-hue-rotate', isSat ? 180 : 0);
      map.current.setPaintProperty('radar-layer', 'raster-opacity', isSat ? 0.9 : 0.75);
      map.current.setPaintProperty('radar-layer', 'raster-saturation', isSat ? -0.5 : 0);
    }
  }, [mapLayerType]);

  useEffect(() => {
    const canvas = windCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    const particles = Array.from({ length: 250 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 0.5 + Math.random() * 2.5,
      angle: (Math.PI / 4) + (Math.random() * 0.4 - 0.2), // Flowing SE roughly
      life: Math.random() * 150
    }));

    const renderWind = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = theme === 'dark' ? 'rgba(120, 200, 255, 0.4)' : 'rgba(0, 100, 255, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      
      particles.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        p.x += Math.cos(p.angle) * p.speed * 2;
        p.y += Math.sin(p.angle) * p.speed * 2;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        
        p.life -= 1;
        if (p.life <= 0 || p.x > canvas.width || p.y > canvas.height || p.x < 0 || p.y < 0) {
          p.x = Math.random() * canvas.width * 0.8; // Mostly start from top-left
          p.y = Math.random() * canvas.height * 0.5;
          p.life = 50 + Math.random() * 150;
        }
      });
      animationFrameId = requestAnimationFrame(renderWind);
    };
    renderWind();
    return () => cancelAnimationFrame(animationFrameId);
  }, [theme]);

  const isSevere = alerts.some(a => a.level && a.level.toLowerCase().includes('severe'));

  return (
    <div className={`dashboard-container ${isSevere ? 'threat-state-severe' : ''}`}>
      {/* Fallback CSS styling for when Mapbox token is missing */}
      {!mapboxToken || mapboxToken === 'your_mapbox_token_here' ? (
        <div className="map-background" style={{ width: '100%', height: '100%', position: 'absolute' }}>
          <div className="radar-ring"></div>
          <div className="radar-ring r-2"></div>
          <div className="storm-polygon"></div>
          <div style={{ position: 'absolute', bottom: '120px', left: '40px', color: '#fff' }}>
            <p>⚠️ Mapbox token missing in ui/.env.local</p>
          </div>
        </div>
      ) : (
        /* Real Mapbox Container */
        <div ref={mapContainer} className="map-background" style={{ width: '100%', height: '100%', position: 'absolute', background: '#0a0e17' }} />
      )}

      {/* Wind Particles Overlay */}
      <canvas ref={windCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />

      {/* Floating Top Bar */}
      <header className="glass-panel top-bar">
        <div className="logo">
          <h1>VAJRA</h1>
          <span className="live-badge">LIVE {mapLayerType === 'radar' ? 'RADAR' : 'SATELLITE'} &bull; 0.5km RES</span>
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Bengaluru Urban / South Grid..." />
        </div>
        
        <div className="view-toggle" style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '4px' }}>
          <button 
            onClick={() => setMapLayerType('radar')}
            style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', background: mapLayerType === 'radar' ? 'var(--color-precip)' : 'transparent', color: mapLayerType === 'radar' ? '#000' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            Radar
          </button>
          <button 
            onClick={() => setMapLayerType('satellite')}
            style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', background: mapLayerType === 'satellite' ? 'var(--color-precip)' : 'transparent', color: mapLayerType === 'satellite' ? '#000' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            Satellite Fusion
          </button>
        </div>

        <div className="nav-actions">
          <button className="nav-icon" onClick={() => setShowTerminal(!showTerminal)} title="MLOps Terminal"><Terminal size={20} /></button>
          <Link href="/alerts" className="nav-icon"><AlertTriangle size={20} color="var(--color-severe)" /></Link>
          <Link href="/settings" className="nav-icon"><Settings size={20} /></Link>
        </div>
      </header>

      {/* Right Sidebar */}
      <aside className="glass-panel sidebar">
        <div className="sidebar-header">
          <h2>AI Nowcast Stream</h2>
          <div className="pulse-indicator"></div>
        </div>

        {alerts.length > 0 && (
          <div className="alert-card severe" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="alert-header">
              <CloudLightning size={20} />
              <h3>{alerts[0].title}</h3>
            </div>
            <p>{alerts[0].level} &bull; {alerts[0].confidence}% Confidence</p>
            <div className="eta">ETA: {alerts[0].eta} mins</div>
          </div>
        )}

        {alerts.length > 1 && (
          <div className="alert-card warning" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="alert-header">
              <Droplets size={20} />
              <h3>{alerts[1].title}</h3>
            </div>
            <p>{alerts[1].desc}</p>
          </div>
        )}

        <div className="telemetry-section">
          <h3>Location Deep-Dive (Physics Fusion)</h3>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="metric">
              <span>Temp</span>
              <strong>{telemetry.temp}&deg;C</strong>
            </div>
            <div className="metric">
              <span>Humidity</span>
              <strong>{telemetry.humidity}%</strong>
            </div>
            <div className="metric">
              <span>Wind</span>
              <strong>{telemetry.wind} km/h</strong>
            </div>
            <div className="metric">
              <span>CAPE</span>
              <strong>{telemetry.cape}</strong>
            </div>
            <div className="metric">
              <span>Shear</span>
              <strong>{telemetry.windShear} kt</strong>
            </div>
            <div className="metric">
              <span>AQI</span>
              <strong style={{ color: telemetry.aqi > 100 ? 'var(--color-severe)' : telemetry.aqi > 50 ? 'var(--color-warning)' : '#4CAF50' }}>{telemetry.aqi}</strong>
            </div>
          </div>

          <div className="chart-container">
            <h4>Precipitation Forecast & AI Confidence</h4>
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={precipitationData}>
                <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={10} />
                <YAxis yAxisId="left" hide />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                <Tooltip
                  cursor={{ fill: 'var(--glass-bg)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="amount" fill="var(--color-precip)" radius={[4, 4, 0, 0]} name="Rain (mm)" />
                <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 3 }} name="Confidence %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Validation Metrics */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Live Validation Metrics</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Critical Success Index (CSI)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10B981' }}>{validationMetrics.csi}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>False Alarm Ratio (FAR)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-warning)' }}>{validationMetrics.far}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Timeline Dock */}
      <div className="glass-panel bottom-dock">
        <div className="timeline-controls">
          <Clock size={16} />
          <span>Forecast vs. History</span>
        </div>
        <div className="scrubber-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          <span className="time-label">T+0</span>
          <input
            type="range"
            min="0"
            max="17"
            value={timeIdx}
            onChange={(e) => setTimeIdx(parseInt(e.target.value))}
            style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--color-precip)' }}
          />
          <span className="time-label" style={{ minWidth: '60px' }}>T+{timeIdx * 5}m</span>
        </div>
      </div>

      {/* Terminal Modal */}
      {showTerminal && (
        <div className="terminal-modal" style={{
          position: 'absolute', bottom: '110px', left: '20px', width: '600px', height: '300px',
          backgroundColor: 'rgba(10, 14, 23, 0.95)', border: '1px solid #2D3748',
          borderRadius: '8px', zIndex: 100, display: 'flex', flexDirection: 'column',
          fontFamily: 'monospace', color: '#00ff00', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ backgroundColor: '#1E1E1E', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #2D3748', color: '#CBD5E0', fontSize: '12px', fontWeight: 'bold' }}>
            <span>Dask / MLOps Pipeline &bull; gpu-cluster-1</span>
            <button onClick={() => setShowTerminal(false)} style={{ color: '#FC8181', cursor: 'pointer', border: 'none', background: 'none' }}>X</button>
          </div>
          <div style={{ padding: '12px', overflowY: 'auto', flex: 1, fontSize: '12px', lineHeight: '1.5', display: 'flex', flexDirection: 'column' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: log.includes('MLOps') ? '#81B3F7' : log.includes('Worker') ? '#FCD34D' : '#00ff00' }}>
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      )}

    </div>
  );
}
