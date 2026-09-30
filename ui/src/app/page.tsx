"use client";
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { 
  Search, AlertTriangle, Wind, Droplets, Activity, Settings, Clock, 
  CloudLightning, Terminal, Play, Pause, SkipBack, SkipForward, 
  BarChart2, Cpu, ShieldAlert, RotateCcw, Thermometer, Plane,
  MapPin, ZoomIn, ZoomOut, Compass, Navigation
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface CityWeatherItem {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number]; // [lon, lat]
  temp: number;
  humidity: number;
  wind: number;
  aqi: number;
  cape: number;
  windShear: number;
  rainRate: string;
  threat: 'Critical' | 'Severe' | 'Moderate' | 'Low' | 'Clear';
  color: string;
  minZoom: number; // min zoom to show marker on map
  pointsZoom: number; // zoom threshold where the 2 key points expand
  point1: string;
  point2: string;
  radarEcho: string;
  alerts: Array<{ title: string; level?: string; confidence?: number; eta?: number; desc?: string }>;
  precipitation: Array<{ time: string; amount: number; confidence: number }>;
}

export const CITIES_DATA: CityWeatherItem[] = [
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    coordinates: [77.5946, 12.9716],
    temp: 27.7,
    humidity: 76,
    wind: 28,
    aqi: 65,
    cape: 1430,
    windShear: 32,
    rainRate: '78 mm/hr',
    threat: 'Severe',
    color: '#ef4444',
    minZoom: 3.0,
    pointsZoom: 8.0,
    point1: 'Convective Core: 68 dBZ (Vortex approaching from NW)',
    point2: 'Severe Flood: Bellandur & Silk Board on Level 4 Red',
    radarEcho: '68 dBZ Supercell',
    alerts: [
      { title: 'Tornadic Vortex Signature', level: 'Level 3 Severe', confidence: 94, eta: 18 },
      { title: 'Precipitation Surge', desc: '+42mm/hr expected in Sector 4 (Approaching from NW)' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 4, confidence: 100 },
      { time: 'NOW', amount: 22, confidence: 100 },
      { time: 'T+15m', amount: 58, confidence: 96 },
      { time: 'T+30m', amount: 42, confidence: 88 },
      { time: 'T+45m', amount: 18, confidence: 74 },
      { time: 'T+60m', amount: 4, confidence: 60 },
    ]
  },
  {
    id: 'delhi',
    name: 'Delhi-NCR',
    state: 'National Capital Region',
    coordinates: [77.2090, 28.6139],
    temp: 33.5,
    humidity: 62,
    wind: 38,
    aqi: 142,
    cape: 1200,
    windShear: 28,
    rainRate: '35 mm/hr',
    threat: 'Moderate',
    color: '#f59e0b',
    minZoom: 3.0,
    pointsZoom: 8.0,
    point1: 'Squall Line Front: 42 kt gust front approaching IGI Airport',
    point2: 'Thermal Cap (-65 J/kg CIN): Severe hail potential if broken',
    radarEcho: '48 dBZ Multi-cell',
    alerts: [
      { title: 'Dust Squall & Wind Shear Advisory', level: 'Level 2 Moderate', confidence: 85, eta: 25 },
      { title: 'Runway Visibility Alert', desc: 'Crosswind 26 kt with blowing dust at VIDP' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 0, confidence: 100 },
      { time: 'NOW', amount: 8, confidence: 95 },
      { time: 'T+15m', amount: 26, confidence: 90 },
      { time: 'T+30m', amount: 35, confidence: 80 },
      { time: 'T+45m', amount: 14, confidence: 70 },
      { time: 'T+60m', amount: 2, confidence: 60 },
    ]
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    coordinates: [72.8777, 19.0760],
    temp: 29.8,
    humidity: 88,
    wind: 34,
    aqi: 58,
    cape: 2400,
    windShear: 35,
    rainRate: '86 mm/hr',
    threat: 'Critical',
    color: '#dc2626',
    minZoom: 3.0,
    pointsZoom: 8.0,
    point1: 'Monsoon Rainband: Torrential deluge exceeding 86 mm/hr',
    point2: 'High Tide Warning: Storm runoff backed up along Mithi River',
    radarEcho: '72 dBZ Convective Cluster',
    alerts: [
      { title: 'High Tide Convective Surge', level: 'Level 4 Critical Red', confidence: 98, eta: 10 },
      { title: 'Urban Flash Inundation', desc: 'Central & Western transit lines face hydroplane risk' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 15, confidence: 100 },
      { time: 'T-15m', amount: 38, confidence: 100 },
      { time: 'NOW', amount: 72, confidence: 98 },
      { time: 'T+15m', amount: 86, confidence: 95 },
      { time: 'T+30m', amount: 64, confidence: 90 },
      { time: 'T+45m', amount: 40, confidence: 80 },
      { time: 'T+60m', amount: 25, confidence: 70 },
    ]
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: [80.2707, 13.0827],
    temp: 31.2,
    humidity: 82,
    wind: 26,
    aqi: 62,
    cape: 1850,
    windShear: 24,
    rainRate: '48 mm/hr',
    threat: 'Moderate',
    color: '#f59e0b',
    minZoom: 3.5,
    pointsZoom: 8.0,
    point1: 'Bay of Bengal Inflow: Deep moisture column (58.2mm PWAT)',
    point2: 'Basin Sluice Alert: Coastal storm drains armed at 85% capacity',
    radarEcho: '54 dBZ Rainband',
    alerts: [
      { title: 'Coastal Convergence Inflow', level: 'Level 2 Moderate', confidence: 88, eta: 30 },
      { title: 'Low-Lying Sump Alert', desc: 'Velachery & Adyar flood basins on standby' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 2, confidence: 100 },
      { time: 'T-15m', amount: 10, confidence: 100 },
      { time: 'NOW', amount: 28, confidence: 95 },
      { time: 'T+15m', amount: 48, confidence: 90 },
      { time: 'T+30m', amount: 36, confidence: 82 },
      { time: 'T+45m', amount: 16, confidence: 72 },
      { time: 'T+60m', amount: 5, confidence: 60 },
    ]
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    coordinates: [88.3639, 22.5726],
    temp: 30.4,
    humidity: 85,
    wind: 30,
    aqi: 74,
    cape: 2100,
    windShear: 31,
    rainRate: '62 mm/hr',
    threat: 'Severe',
    color: '#ef4444',
    minZoom: 3.5,
    pointsZoom: 8.0,
    point1: "Nor'wester Squall: Multi-cell thunderstorm tracking SE at 45 km/h",
    point2: 'Lightning Surge: Extreme cloud-to-ground flash rate (16/min)',
    radarEcho: '64 dBZ Norwester',
    alerts: [
      { title: 'Kalbaishakhi Thunderstorm Warning', level: 'Level 3 Severe', confidence: 92, eta: 15 },
      { title: 'Gale Inflow Alert', desc: 'Gusts up to 65 km/h expected across Hooghly basin' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 8, confidence: 100 },
      { time: 'NOW', amount: 34, confidence: 96 },
      { time: 'T+15m', amount: 62, confidence: 94 },
      { time: 'T+30m', amount: 48, confidence: 85 },
      { time: 'T+45m', amount: 20, confidence: 70 },
      { time: 'T+60m', amount: 6, confidence: 55 },
    ]
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    coordinates: [78.4867, 17.3850],
    temp: 31.8,
    humidity: 70,
    wind: 22,
    aqi: 82,
    cape: 1350,
    windShear: 25,
    rainRate: '42 mm/hr',
    threat: 'Moderate',
    color: '#f59e0b',
    minZoom: 4.0,
    pointsZoom: 8.0,
    point1: 'Isolated Convective Cell: 52 dBZ radar echo developing over Hitec City',
    point2: 'Microburst Risk: Downdraft shear -14 kt on runway approach',
    radarEcho: '52 dBZ Cell',
    alerts: [
      { title: 'Convective Cell Advisory', level: 'Level 2 Moderate', confidence: 82, eta: 35 },
      { title: 'Underpass Sump Alert', desc: 'Begumpet and Gachibowli drainage units activated' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 2, confidence: 100 },
      { time: 'NOW', amount: 16, confidence: 90 },
      { time: 'T+15m', amount: 42, confidence: 86 },
      { time: 'T+30m', amount: 30, confidence: 78 },
      { time: 'T+45m', amount: 12, confidence: 65 },
      { time: 'T+60m', amount: 0, confidence: 50 },
    ]
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    coordinates: [73.8567, 18.5204],
    temp: 28.1,
    humidity: 79,
    wind: 20,
    aqi: 54,
    cape: 1100,
    windShear: 22,
    rainRate: '28 mm/hr',
    threat: 'Low',
    color: '#10b981',
    minZoom: 4.5,
    pointsZoom: 8.0,
    point1: 'Ghats Orographic Uplift: Rainbands drifting east towards city basin',
    point2: 'River Catchment: Mutha spillway inflow nominal (+0.4m depth)',
    radarEcho: '38 dBZ Stratiform',
    alerts: [
      { title: 'Orographic Shower Alert', level: 'Level 1 Low', confidence: 78, eta: 40 },
      { title: 'Surface Runoff Advisory', desc: 'Mild ponding observed near Shivaji Nagar' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 5, confidence: 100 },
      { time: 'NOW', amount: 18, confidence: 95 },
      { time: 'T+15m', amount: 28, confidence: 88 },
      { time: 'T+30m', amount: 20, confidence: 80 },
      { time: 'T+45m', amount: 10, confidence: 70 },
      { time: 'T+60m', amount: 2, confidence: 60 },
    ]
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    coordinates: [72.5714, 23.0225],
    temp: 35.0,
    humidity: 54,
    wind: 18,
    aqi: 110,
    cape: 850,
    windShear: 18,
    rainRate: '12 mm/hr',
    threat: 'Low',
    color: '#10b981',
    minZoom: 4.5,
    pointsZoom: 8.0,
    point1: 'High LCL Cloud Base (1.8km): Sub-cloud virga evaporating rain',
    point2: 'Thermal Boundary: Dust suspension with visibility at 3.5 km',
    radarEcho: '28 dBZ Dry Echo',
    alerts: [
      { title: 'Dry Thermal Boundary Layer', level: 'Level 1 Low', confidence: 70, eta: 50 },
      { title: 'Particulate Suspension', desc: 'AQI elevated; no severe flash flooding expected' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 0, confidence: 100 },
      { time: 'NOW', amount: 2, confidence: 85 },
      { time: 'T+15m', amount: 12, confidence: 80 },
      { time: 'T+30m', amount: 8, confidence: 70 },
      { time: 'T+45m', amount: 2, confidence: 60 },
      { time: 'T+60m', amount: 0, confidence: 50 },
    ]
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    coordinates: [76.2673, 9.9312],
    temp: 28.6,
    humidity: 91,
    wind: 24,
    aqi: 42,
    cape: 1650,
    windShear: 26,
    rainRate: '54 mm/hr',
    threat: 'Moderate',
    color: '#f59e0b',
    minZoom: 4.5,
    pointsZoom: 8.0,
    point1: 'Arabian Sea Plume: Heavy tropical warm rain process active',
    point2: 'Periyar Basin: Hydrological runoff alert level 1 engaged',
    radarEcho: '56 dBZ Oceanic Cell',
    alerts: [
      { title: 'Coastal Squall Warning', level: 'Level 2 Moderate', confidence: 89, eta: 20 },
      { title: 'Backwater Runoff Alert', desc: 'Port container transit gates on waterlogged notice' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 8, confidence: 100 },
      { time: 'T-15m', amount: 22, confidence: 100 },
      { time: 'NOW', amount: 44, confidence: 95 },
      { time: 'T+15m', amount: 54, confidence: 90 },
      { time: 'T+30m', amount: 38, confidence: 85 },
      { time: 'T+45m', amount: 20, confidence: 75 },
      { time: 'T+60m', amount: 8, confidence: 65 },
    ]
  },
  {
    id: 'guwahati',
    name: 'Guwahati',
    state: 'Assam',
    coordinates: [91.7362, 26.1445],
    temp: 27.2,
    humidity: 86,
    wind: 16,
    aqi: 48,
    cape: 1950,
    windShear: 29,
    rainRate: '68 mm/hr',
    threat: 'Severe',
    color: '#ef4444',
    minZoom: 4.5,
    pointsZoom: 8.0,
    point1: 'Brahmaputra Valley Deluge: Stationary cloudburst cell over basin',
    point2: 'Landslide Warning: Hillslope soil saturation index at 92%',
    radarEcho: '66 dBZ Stationary',
    alerts: [
      { title: 'Stationary Cloudburst Alert', level: 'Level 3 Severe', confidence: 94, eta: 12 },
      { title: 'Hillslope Soil Saturation', desc: 'Critical slope runoff warning along NH27' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 10, confidence: 100 },
      { time: 'T-15m', amount: 32, confidence: 100 },
      { time: 'NOW', amount: 56, confidence: 98 },
      { time: 'T+15m', amount: 68, confidence: 94 },
      { time: 'T+30m', amount: 52, confidence: 88 },
      { time: 'T+45m', amount: 30, confidence: 78 },
      { time: 'T+60m', amount: 14, confidence: 65 },
    ]
  },
  // Detailed Metropolitan Sub-Sectors (Visible on higher zoom ratios)
  {
    id: 'bellandur',
    name: 'Bellandur (Ward 150)',
    state: 'Bengaluru Urban',
    coordinates: [77.6762, 12.9298],
    temp: 26.8,
    humidity: 89,
    wind: 32,
    aqi: 52,
    cape: 1850,
    windShear: 38,
    rainRate: '78 mm/hr',
    threat: 'Critical',
    color: '#dc2626',
    minZoom: 9.5,
    pointsZoom: 10.5,
    point1: 'Peak Inundation: 1.4m runoff at ORR underpass',
    point2: 'Drainage Action: 5/6 automated flood pumps active',
    radarEcho: '68 dBZ Deluge',
    alerts: [
      { title: 'Critical Inundation Alert', level: 'Level 4 Critical Red', confidence: 98, eta: 5 },
      { title: 'Underpass Submerged', desc: 'Outer Ring Road traffic diverted via Sarjapur corridor' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 5, confidence: 100 },
      { time: 'T-15m', amount: 28, confidence: 100 },
      { time: 'NOW', amount: 62, confidence: 98 },
      { time: 'T+15m', amount: 78, confidence: 96 },
      { time: 'T+30m', amount: 55, confidence: 90 },
      { time: 'T+45m', amount: 30, confidence: 80 },
      { time: 'T+60m', amount: 12, confidence: 65 },
    ]
  },
  {
    id: 'silk-board',
    name: 'Silk Board (Ward 174)',
    state: 'Bengaluru Urban',
    coordinates: [77.6229, 12.9172],
    temp: 27.0,
    humidity: 87,
    wind: 30,
    aqi: 58,
    cape: 1720,
    windShear: 34,
    rainRate: '65 mm/hr',
    threat: 'Critical',
    color: '#dc2626',
    minZoom: 9.5,
    pointsZoom: 10.5,
    point1: 'Underpass Waterlogged: 1.1m depth; vehicles diverted',
    point2: 'Runoff Convergence: Madiwala lake overflow armed',
    radarEcho: '64 dBZ Vortex',
    alerts: [
      { title: 'Traffic Junction Inundation', level: 'Level 4 Critical Red', confidence: 96, eta: 8 },
      { title: '4/4 Pump Stations Armed', desc: 'Hosur Road underpass closed to two-wheelers' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 4, confidence: 100 },
      { time: 'T-15m', amount: 20, confidence: 100 },
      { time: 'NOW', amount: 50, confidence: 98 },
      { time: 'T+15m', amount: 65, confidence: 94 },
      { time: 'T+30m', amount: 45, confidence: 88 },
      { time: 'T+45m', amount: 22, confidence: 75 },
      { time: 'T+60m', amount: 8, confidence: 60 },
    ]
  },
  {
    id: 'whitefield',
    name: 'Whitefield - ITPL',
    state: 'Bengaluru Urban',
    coordinates: [77.7499, 12.9698],
    temp: 28.0,
    humidity: 75,
    wind: 22,
    aqi: 60,
    cape: 1280,
    windShear: 26,
    rainRate: '32 mm/hr',
    threat: 'Moderate',
    color: '#f59e0b',
    minZoom: 9.5,
    pointsZoom: 10.5,
    point1: 'Downwind Cloud Shield: Light 32 mm/hr rainband',
    point2: 'Transit Corridor: Metro Purple Line operating nominal',
    radarEcho: '44 dBZ Moderate',
    alerts: [
      { title: 'Moderate Cloud Shield', level: 'Level 2 Moderate', confidence: 85, eta: 25 },
      { title: 'Transit Sump Nominal', desc: 'No critical underpass waterlogging detected' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 4, confidence: 100 },
      { time: 'NOW', amount: 14, confidence: 92 },
      { time: 'T+15m', amount: 32, confidence: 90 },
      { time: 'T+30m', amount: 24, confidence: 80 },
      { time: 'T+45m', amount: 10, confidence: 70 },
      { time: 'T+60m', amount: 2, confidence: 55 },
    ]
  },
  {
    id: 'hebbal',
    name: 'Hebbal Flyover (Ward 7)',
    state: 'Bengaluru Urban',
    coordinates: [77.5970, 13.0358],
    temp: 27.4,
    humidity: 80,
    wind: 26,
    aqi: 66,
    cape: 1540,
    windShear: 30,
    rainRate: '48 mm/hr',
    threat: 'Severe',
    color: '#ef4444',
    minZoom: 9.5,
    pointsZoom: 10.5,
    point1: 'Flyover Inflow: 48 mm/hr cell passing northwards',
    point2: 'Storm Drain Level: 0.6m runoff; pumps on standby',
    radarEcho: '56 dBZ Squall',
    alerts: [
      { title: 'Airport Expressway Alert', level: 'Level 3 Severe', confidence: 90, eta: 15 },
      { title: 'Hydroplane Advisory', desc: 'Speed limit advisory 50 km/h on NH44 elevated corridor' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 0, confidence: 100 },
      { time: 'T-15m', amount: 12, confidence: 100 },
      { time: 'NOW', amount: 38, confidence: 96 },
      { time: 'T+15m', amount: 48, confidence: 92 },
      { time: 'T+30m', amount: 30, confidence: 82 },
      { time: 'T+45m', amount: 12, confidence: 70 },
      { time: 'T+60m', amount: 3, confidence: 58 },
    ]
  },
  {
    id: 'vobl-airport',
    name: 'Kempegowda Int Airport (VOBL)',
    state: 'Bengaluru Aviation',
    coordinates: [77.7064, 13.1986],
    temp: 26.5,
    humidity: 84,
    wind: 38,
    aqi: 48,
    cape: 1920,
    windShear: 42,
    rainRate: '60 mm/hr',
    threat: 'Severe',
    color: '#ef4444',
    minZoom: 9.0,
    pointsZoom: 10.0,
    point1: 'Runway Microburst: -18 kt shear alert on 3nm final',
    point2: 'ATC Go-Around: Crosswind 21 kt gusting to 38 kt',
    radarEcho: '62 dBZ Microburst',
    alerts: [
      { title: 'Runway Wind Shear Go-Around', level: 'Level 3 Severe', confidence: 96, eta: 6 },
      { title: 'Diversion Advisory 58%', desc: 'Inbound arrivals holding at BIA VOR corridor' }
    ],
    precipitation: [
      { time: 'T-30m', amount: 2, confidence: 100 },
      { time: 'T-15m', amount: 18, confidence: 100 },
      { time: 'NOW', amount: 46, confidence: 96 },
      { time: 'T+15m', amount: 60, confidence: 94 },
      { time: 'T+30m', amount: 40, confidence: 86 },
      { time: 'T+45m', amount: 18, confidence: 72 },
      { time: 'T+60m', amount: 4, confidence: 55 },
    ]
  }
];

const RADAR_BOUNDS: [[number, number], [number, number], [number, number], [number, number]] = [
  [77.4, 13.2], // Top left (lon, lat)
  [77.8, 13.2], // Top right
  [77.8, 12.8], // Bottom right
  [77.4, 12.8]  // Bottom left
];

function getCleanApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const pub = (process.env.NEXT_PUBLIC_API_URL || '').trim();
      if (pub && !pub.includes('localhost') && !pub.includes('127.0.0.1')) {
        return pub.replace(/\/+$/, '');
      }
      return 'https://vajra-production-aad1.up.railway.app';
    }
  }
  let raw = (process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();
  if (raw && !raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = `https://${raw}`;
  }
  return raw.replace(/\/+$/, '');
}

function generateRadarFrame(timeStep: number): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const t = Math.max(0, Math.min(17, timeStep));
    const progress = t / 17; // 0.0 (NW) to 1.0 (SE)

    ctx.clearRect(0, 0, 512, 512);

    const cx1 = 150 + progress * 215;
    const cy1 = 135 + progress * 210;
    const peakFactor = Math.max(0, 1 - Math.abs(progress - 0.45) * 1.8);
    const r1 = 110 + Math.sin(progress * Math.PI) * 65;

    // 1. Broad outer precipitation shield
    const gradShield = ctx.createRadialGradient(cx1, cy1, 15, cx1, cy1, r1 * 1.25);
    gradShield.addColorStop(0, 'rgba(0, 180, 255, 0.45)');
    gradShield.addColorStop(0.7, 'rgba(0, 200, 255, 0.25)');
    gradShield.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradShield;
    ctx.beginPath();
    ctx.arc(cx1, cy1, r1 * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // 2. Primary Convective Core
    const grad1 = ctx.createRadialGradient(cx1, cy1, 6, cx1, cy1, r1);
    if (peakFactor > 0.6) {
      grad1.addColorStop(0, 'rgba(236, 72, 153, 0.96)');
      grad1.addColorStop(0.18, 'rgba(220, 38, 38, 0.95)');
    } else if (progress < 0.8) {
      grad1.addColorStop(0, 'rgba(239, 68, 68, 0.92)');
      grad1.addColorStop(0.20, 'rgba(249, 115, 22, 0.88)');
    } else {
      grad1.addColorStop(0, 'rgba(249, 115, 22, 0.75)');
    }
    grad1.addColorStop(0.32, 'rgba(249, 115, 22, 0.88)');
    grad1.addColorStop(0.52, 'rgba(234, 179, 8, 0.82)');
    grad1.addColorStop(0.75, 'rgba(34, 197, 94, 0.72)');
    grad1.addColorStop(0.92, 'rgba(6, 182, 212, 0.50)');
    grad1.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(cx1, cy1, r1, 0, Math.PI * 2);
    ctx.fill();

    // 3. Secondary trailing convective cell
    const angle = 2.2 - progress * 0.9;
    const dist = 85 + Math.sin(progress * Math.PI) * 25;
    const cx2 = cx1 + Math.cos(angle) * dist;
    const cy2 = cy1 + Math.sin(angle) * dist;
    const r2 = 60 + progress * 35;

    const grad2 = ctx.createRadialGradient(cx2, cy2, 5, cx2, cy2, r2);
    grad2.addColorStop(0, 'rgba(249, 115, 22, 0.85)');
    grad2.addColorStop(0.35, 'rgba(234, 179, 8, 0.75)');
    grad2.addColorStop(0.70, 'rgba(34, 197, 94, 0.60)');
    grad2.addColorStop(0.92, 'rgba(6, 182, 212, 0.35)');
    grad2.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Inflow feeder band
    ctx.save();
    ctx.translate(cx1, cy1);
    ctx.rotate(0.4 + progress * 0.6);
    const grad3 = ctx.createRadialGradient(35, -25, 4, 35, -25, 80);
    grad3.addColorStop(0, 'rgba(234, 179, 8, 0.65)');
    grad3.addColorStop(0.5, 'rgba(34, 197, 94, 0.45)');
    grad3.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad3;
    ctx.beginPath();
    ctx.ellipse(35, -25, 80, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return canvas.toDataURL('image/png');
  } catch (e) {
    return '';
  }
}

export default function Dashboard() {
  const { theme } = useTheme();
  const [timeIdx, setTimeIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const windCanvasRef = useRef<HTMLCanvasElement>(null);

  // Active Selected City (defaults to Bengaluru)
  const [selectedCity, setSelectedCity] = useState<CityWeatherItem>(CITIES_DATA[0]);
  const [currentZoom, setCurrentZoom] = useState<number>(11.5);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const radarFramesCacheRef = useRef<string[]>([]);
  const timeIdxRef = useRef<number>(timeIdx);
  timeIdxRef.current = timeIdx;

  const markersRef = useRef<{ marker: mapboxgl.Marker; city: CityWeatherItem; el: HTMLElement }[]>([]);

  // Pre-generate all 18 frames into memory on mount
  useEffect(() => {
    const frames: string[] = [];
    for (let i = 0; i <= 17; i++) {
      frames.push(generateRadarFrame(i));
    }
    radarFramesCacheRef.current = frames;
  }, []);

  const [precipitationData, setPrecipitationData] = useState(CITIES_DATA[0].precipitation);
  const [showTerminal, setShowTerminal] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [mapLayerType, setMapLayerType] = useState<'radar' | 'satellite'>('radar');

  const [telemetry, setTelemetry] = useState({
    temp: CITIES_DATA[0].temp,
    humidity: CITIES_DATA[0].humidity,
    wind: CITIES_DATA[0].wind,
    aqi: CITIES_DATA[0].aqi,
    cape: CITIES_DATA[0].cape,
    windShear: CITIES_DATA[0].windShear
  });

  const [validationMetrics] = useState({
    csi: 0.82,
    far: 0.14
  });

  const [alerts, setAlerts] = useState(CITIES_DATA[0].alerts);
  const API_BASE = getCleanApiBase();
  const mapboxToken = (process.env.NEXT_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '').trim();

  // Function to select a city and smoothly fly the map to it
  const handleSelectCity = (city: CityWeatherItem) => {
    setSelectedCity(city);
    setTelemetry({
      temp: city.temp,
      humidity: city.humidity,
      wind: city.wind,
      aqi: city.aqi,
      cape: city.cape,
      windShear: city.windShear
    });
    setPrecipitationData(city.precipitation);
    setAlerts(city.alerts);

    // Update active marker styling
    markersRef.current.forEach(item => {
      if (item.city.id === city.id) {
        item.el.classList.add('active');
      } else {
        item.el.classList.remove('active');
      }
    });

    // Smoothly fly map to target city coordinates
    if (map.current) {
      const targetZoom = Math.max(map.current.getZoom(), city.pointsZoom >= 10 ? 11.5 : 9.5);
      map.current.flyTo({
        center: city.coordinates,
        zoom: targetZoom,
        pitch: 55,
        bearing: -15,
        essential: true,
        duration: 1800
      });
    }
  };

  // Terminal logging simulator
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

  // Mapbox Initialization and Markers Setup
  useEffect(() => {
    const token = mapboxToken;
    if (!token || token === 'your_mapbox_token_here') return;

    mapboxgl.accessToken = token;
    if (map.current) return;

    if (mapContainer.current) {
      try {
        console.log("Initializing Mapbox with token: ", token.substring(0, 10) + "...");
        const m = new mapboxgl.Map({
          container: mapContainer.current,
          style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
          center: [77.5946, 12.9716], // Bengaluru coordinates
          zoom: 11.5,
          pitch: 65,
          bearing: -20,
          antialias: true,
          // Explicitly guarantee full interactive capabilities
          interactive: true,
          boxZoom: true,
          dragRotate: true,
          dragPan: true,
          keyboard: true,
          doubleClickZoom: true,
          touchZoomRotate: true,
          scrollZoom: true
        });

        // Add 3D Navigation & Zoom Controls
        m.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
        m.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

        map.current = m;

        m.on('load', () => {
          console.log("Mapbox loaded successfully");

          // Add 3D Terrain
          m.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          m.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

          // Add Sky Layer
          m.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 0.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });

          // Insert 3D buildings beneath symbols
          const layers = m.getStyle()?.layers;
          let labelLayerId;
          if (layers) {
            for (const layer of layers) {
              if (layer.type === 'symbol' && layer.layout && (layer.layout as Record<string, any>)?.['text-field']) {
                labelLayerId = layer.id;
                break;
              }
            }
          }

          m.addLayer(
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
          const initialFrame = radarFramesCacheRef.current[timeIdx] || generateRadarFrame(timeIdx);
          m.addSource('radar', {
            type: 'image',
            url: initialFrame,
            coordinates: RADAR_BOUNDS
          });

          m.addLayer({
            id: 'radar-layer',
            type: 'raster',
            source: 'radar',
            paint: {
              'raster-opacity': 0.78,
              'raster-fade-duration': 0
            }
          });

          // Create City Weather Markers with Dynamic Zoom Point Expansion
          const currentZ = m.getZoom();
          markersRef.current = [];

          CITIES_DATA.forEach(city => {
            const el = document.createElement('div');
            el.className = `vajra-city-marker ${city.id === selectedCity.id ? 'active' : ''} ${currentZ >= city.pointsZoom ? 'show-points' : ''}`;
            el.style.display = currentZ >= city.minZoom ? 'block' : 'none';

            el.innerHTML = `
              <div class="vajra-marker-card">
                <div class="vajra-marker-header">
                  <div class="vajra-marker-title-wrap">
                    <span class="vajra-marker-dot" style="background:${city.color}; color:${city.color};"></span>
                    <span class="vajra-marker-name">${city.name}</span>
                  </div>
                  <span class="vajra-marker-temp">${city.temp}°C</span>
                  <span class="vajra-marker-badge" style="background:${city.color}25; color:${city.color}; border: 1px solid ${city.color}50;">${city.threat}</span>
                </div>
                <div class="vajra-marker-points">
                  <div class="vajra-marker-point-item">
                    <span class="vajra-marker-point-bullet" style="color:${city.color};">•</span>
                    <span>${city.point1}</span>
                  </div>
                  <div class="vajra-marker-point-item">
                    <span class="vajra-marker-point-bullet" style="color:${city.color};">•</span>
                    <span>${city.point2}</span>
                  </div>
                </div>
              </div>
            `;

            el.addEventListener('click', (ev) => {
              ev.stopPropagation();
              handleSelectCity(city);
            });

            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat(city.coordinates)
              .addTo(m);

            markersRef.current.push({ marker, city, el });
          });

          // Update zoom ratio and marker expansion on every zoom step
          m.on('zoom', () => {
            const z = m.getZoom();
            setCurrentZoom(z);

            markersRef.current.forEach(item => {
              // Toggle marker visibility based on minZoom
              if (z >= item.city.minZoom) {
                item.el.style.display = 'block';
              } else {
                item.el.style.display = 'none';
              }

              // Toggle 2-point expansion after crossing city.pointsZoom threshold!
              if (z >= item.city.pointsZoom) {
                item.el.classList.add('show-points');
              } else {
                item.el.classList.remove('show-points');
              }
            });
          });

          // Click anywhere on map to discover closest city or sample localized coordinate
          m.on('click', (e) => {
            const clickLng = e.lngLat.lng;
            const clickLat = e.lngLat.lat;

            // Find closest city in dataset
            let closest = CITIES_DATA[0];
            let minDist = Infinity;
            CITIES_DATA.forEach(c => {
              const d = Math.hypot(c.coordinates[0] - clickLng, c.coordinates[1] - clickLat);
              if (d < minDist) {
                minDist = d;
                closest = c;
              }
            });

            // If clicked near a known city (< 0.8 deg), select that city
            if (minDist < 0.8) {
              handleSelectCity(closest);
            } else {
              // Custom localized interpolation
              setSelectedCity({
                ...closest,
                id: `loc-${clickLat.toFixed(2)}-${clickLng.toFixed(2)}`,
                name: `Grid [${clickLat.toFixed(2)}°N, ${clickLng.toFixed(2)}°E]`,
                state: 'Micro-Grid Sector',
                coordinates: [clickLng, clickLat],
                temp: parseFloat((24 + Math.random() * 8).toFixed(1)),
                humidity: Math.floor(65 + Math.random() * 30),
                wind: Math.floor(10 + Math.random() * 35),
                aqi: Math.floor(45 + Math.random() * 80),
                cape: Math.floor(800 + Math.random() * 2000),
                windShear: Math.floor(15 + Math.random() * 45),
                point1: `Radial Velocity: ${Math.floor(Math.random() * 25 - 12)} m/s Doppler shift detected`,
                point2: `Convective Initiation: Localized moisture convergence +34 mm/hr`
              });
            }

            // Add click pulse beacon
            const beacon = new mapboxgl.Marker({ color: '#38bdf8' })
              .setLngLat(e.lngLat)
              .addTo(m);
            setTimeout(() => beacon.remove(), 2200);
          });
        });

        m.on('error', (e) => {
          console.error("Mapbox Error:", e);
        });
      } catch (err) {
        console.error("Failed to initialize Mapbox:", err);
      }
    }

    return () => {
      markersRef.current.forEach(item => item.marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [theme]);

  // Playback timer for auto-stepping through nowcast frames
  useEffect(() => {
    if (!isPlaying) return;
    const playTimer = setInterval(() => {
      setTimeIdx((prev) => (prev >= 17 ? 0 : prev + 1));
    }, 750);
    return () => clearInterval(playTimer);
  }, [isPlaying]);

  // Synchronize radar overlay and telemetry whenever timeIdx changes
  useEffect(() => {
    timeIdxRef.current = timeIdx;

    if (map.current) {
      const source = map.current.getSource('radar') as mapboxgl.ImageSource | undefined;
      if (source) {
        const frameUrl = radarFramesCacheRef.current[timeIdx] || generateRadarFrame(timeIdx);
        if (frameUrl) {
          try {
            source.updateImage({
              url: frameUrl,
              coordinates: RADAR_BOUNDS
            });
          } catch (err) {
            console.warn("Could not update radar frame image:", err);
          }
        }
      }
    }
  }, [timeIdx]);

  // Wind Particles Overlay
  useEffect(() => {
    const canvas = windCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particleCount = 120;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 1.2 + Math.random() * 2.2,
      angle: 0.65 + Math.random() * 0.25,
      life: 50 + Math.random() * 150
    }));

    const renderWind = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = theme === 'dark' ? 'rgba(120, 200, 255, 0.35)' : 'rgba(0, 100, 255, 0.25)';
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
          p.x = Math.random() * canvas.width * 0.8;
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

  // Filter cities for search dropdown
  const filteredCities = searchQuery.trim() === '' 
    ? CITIES_DATA.slice(0, 6)
    : CITIES_DATA.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.state.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className={`dashboard-container ${isSevere ? 'threat-state-severe' : ''}`}>
      {/* Real Interactive Mapbox Container */}
      <div 
        ref={mapContainer} 
        className="map-background" 
        style={{ width: '100%', height: '100%', position: 'absolute', background: '#0a0e17' }} 
      />

      {/* Wind Particles Overlay */}
      <canvas 
        ref={windCanvasRef} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} 
      />

      {/* Floating Top Bar */}
      <header className="glass-panel top-bar">
        <div className="logo">
          <h1>VAJRA</h1>
          <span className="live-badge">LIVE {mapLayerType === 'radar' ? 'RADAR' : 'SATELLITE'} &bull; 0.5km RES</span>
        </div>

        {/* Interactive Search Container with Autocomplete Dropdown */}
        <div className="search-container" style={{ position: 'relative' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search City or Sector (e.g. Mumbai, Delhi, Bellandur)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredCities.length > 0) {
                handleSelectCity(filteredCities[0]);
                setIsSearchFocused(false);
              }
            }}
          />

          {/* Autocomplete City Dropdown */}
          {isSearchFocused && (
            <div 
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                zIndex: 50,
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '6px'
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '6px 10px', fontWeight: 'bold' }}>
                Select City / Weather Radar Grid
              </div>
              {filteredCities.map(city => (
                <div
                  key={city.id}
                  onClick={() => {
                    handleSelectCity(city);
                    setSearchQuery(city.name);
                    setIsSearchFocused(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedCity?.id === city.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    borderLeft: selectedCity?.id === city.id ? `3px solid ${city.color}` : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedCity?.id === city.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {city.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {city.state} • {city.radarEcho}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: city.color, padding: '2px 6px', borderRadius: '4px', background: `${city.color}20` }}>
                      {city.threat}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {city.temp}°C
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/disaster-ops" className="nav-link-btn" title="Municipal Disaster Ops & Civil Defense">
            <ShieldAlert size={14} color="#ef4444" />
            <span>Disaster Ops</span>
          </Link>
          <Link href="/replay" className="nav-link-btn" title="Historical Storm Replay & Benchmarks">
            <RotateCcw size={14} color="var(--color-precip)" />
            <span>Case Studies</span>
          </Link>
          <Link href="/thermodynamics" className="nav-link-btn" title="Vertical Atmospheric Soundings (Skew-T)">
            <Thermometer size={14} color="#f59e0b" />
            <span>Soundings</span>
          </Link>
          <Link href="/aviation" className="nav-link-btn" title="Aviation Weather & Runway Safety">
            <Plane size={14} color="#60A5FA" />
            <span>Aviation</span>
          </Link>
          <Link href="/analytics" className="nav-link-btn" title="Meteorological Validation & Analytics">
            <BarChart2 size={14} />
            <span>Analytics</span>
          </Link>
          <Link href="/models" className="nav-link-btn" title="Physics Fusion & Explainability (XAI)">
            <Cpu size={14} />
            <span>Models</span>
          </Link>

          <button 
            className="nav-icon" 
            title="MLOps Terminal"
            onClick={() => setShowTerminal(!showTerminal)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
          >
            <Terminal size={18} />
          </button>
          <Link href="/alerts" className="nav-icon" title="Active Severe Alerts" style={{ padding: '0 4px' }}>
            <AlertTriangle size={18} color="var(--color-severe)" />
          </Link>
          <Link href="/settings" className="nav-icon" title="Settings" style={{ padding: '0 4px' }}>
            <Settings size={18} />
          </Link>
        </div>
      </header>

      {/* Floating Zoom & Map Control Indicator (Top Left under Header) */}
      <div 
        style={{
          position: 'absolute',
          top: '90px',
          left: '24px',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '6px 14px',
          fontSize: '12px',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <Navigation size={13} color="var(--color-precip)" />
          Zoom: {currentZoom.toFixed(1)}x
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>•</span>
        <span style={{ color: currentZoom >= 8.0 ? '#10B981' : 'var(--text-secondary)', fontSize: '11px' }}>
          {currentZoom >= 8.0 ? '✨ 2 Key Insights Active' : '🔍 Zoom in (≥8x) for City Insights'}
        </span>
        <button
          onClick={() => {
            if (map.current) {
              map.current.flyTo({ center: [77.5946, 12.9716], zoom: 11.5, pitch: 65, bearing: -20, duration: 1500 });
              setSelectedCity(CITIES_DATA[0]);
            }
          }}
          style={{
            marginLeft: '6px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '12px',
            padding: '2px 8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600
          }}
          title="Reset View to Central Bengaluru Doppler Radar"
        >
          Reset View
        </button>
      </div>

      {/* Interactive Sidebar: Dynamic City Deep-Dive with the 2 Key Points */}
      <aside className="glass-panel sidebar" style={{ zIndex: 20 }}>
        <div className="sidebar-header">
          <h2>AI Nowcast Stream</h2>
          <div className="pulse-indicator"></div>
        </div>

        {/* Selected City Severe Alert Cards */}
        {alerts[0] && (
          <div className="alert-card severe" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div className="alert-header">
              <CloudLightning size={20} />
              <h3>{alerts[0].title}</h3>
            </div>
            <p>{alerts[0].level} &bull; {alerts[0].confidence}% Confidence</p>
            {alerts[0].eta !== undefined && <div className="eta">ETA: {alerts[0].eta} mins</div>}
          </div>
        )}

        {alerts[1] && (
          <div className="alert-card warning" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div className="alert-header">
              <Droplets size={20} />
              <h3>{alerts[1].title}</h3>
            </div>
            <p>{alerts[1].desc}</p>
          </div>
        )}

        {/* Location Deep-Dive & Main 2 Meteorological Points */}
        <div className="telemetry-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>
              {selectedCity ? selectedCity.name : 'Location Deep-Dive'}
            </h3>
            {selectedCity && (
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                background: `${selectedCity.color}25`, 
                color: selectedCity.color,
                fontWeight: 'bold',
                border: `1px solid ${selectedCity.color}50`
              }}>
                {selectedCity.threat}
              </span>
            )}
          </div>

          {/* The 2 Main Key Points Card */}
          {selectedCity && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: `1px solid ${selectedCity.color}40`, 
              borderRadius: '8px', 
              padding: '10px 12px', 
              marginBottom: '16px', 
              fontSize: '12px',
              lineHeight: '1.45',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Key Meteorological Points ({selectedCity.state})
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <span style={{ color: selectedCity.color, fontWeight: 'bold' }}>•</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedCity.point1}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ color: selectedCity.color, fontWeight: 'bold' }}>•</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedCity.point2}</span>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
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

          {/* Localized Precipitation Forecast Chart */}
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

      {/* Bottom Timeline Dock with Play/Pause & Step Controls */}
      <div className="glass-panel bottom-dock" style={{ zIndex: 30, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="timeline-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'var(--color-severe)' : 'var(--color-precip)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s, background 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}
            title={isPlaying ? "Pause Radar Loop" : "Play Radar Loop"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
          </button>
          
          <button
            onClick={() => setTimeIdx((prev) => Math.max(0, prev - 1))}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Previous Step (-5m)"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={() => setTimeIdx((prev) => Math.min(17, prev + 1))}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Next Step (+5m)"
          >
            <SkipForward size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
            <Clock size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Forecast Horizon</span>
          </div>
        </div>

        <div className="scrubber-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, position: 'relative', zIndex: 35 }}>
          <span className="time-label" style={{ fontWeight: 600, fontSize: '12px' }}>T+0m</span>
          <input
            type="range"
            min="0"
            max="17"
            step="1"
            value={timeIdx}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setTimeIdx(val);
            }}
            style={{
              flex: 1,
              cursor: 'pointer',
              accentColor: 'var(--color-precip)',
              height: '8px',
              borderRadius: '4px',
              touchAction: 'none'
            }}
          />
          <span className="time-label" style={{ minWidth: '70px', fontWeight: 'bold', color: 'var(--color-precip)', fontSize: '14px', textAlign: 'right' }}>
            T+{timeIdx * 5}m
          </span>
        </div>
      </div>

      {/* MLOps Floating Terminal Modal */}
      {showTerminal && (
        <div 
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: '90px',
            right: '380px',
            width: '520px',
            height: '320px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)',
            background: 'rgba(10, 14, 23, 0.95)'
          }}
        >
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} color="#10B981" />
              <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>VAJRA HPC &amp; MLOps Ingestion Pipeline</span>
            </div>
            <button 
              onClick={() => setShowTerminal(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
            >
              &times;
            </button>
          </div>
          <div style={{
            flex: 1,
            padding: '12px 14px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#10B981',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{ wordBreak: 'break-all' }}>{log}</div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
