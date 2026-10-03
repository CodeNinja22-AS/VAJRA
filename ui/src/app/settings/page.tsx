"use client";
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Moon, Sun, Monitor } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="page-container" style={{ maxWidth: '1000px', padding: '24px 24px 100px' }}>
      <Navbar />
      <Link href="/" className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>
      
      <h1>Settings</h1>
      
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
        <div className="settings-section">
          <h2>Appearance</h2>
          
          <div className="settings-row">
            <div>
              <strong>Theme Preference</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>Choose how VAJRA looks to you.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setTheme('light')}
                style={{ 
                  padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                  background: theme === 'light' ? 'var(--color-clear)' : 'transparent',
                  color: theme === 'light' ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${theme === 'light' ? 'var(--color-clear)' : 'var(--border-color)'}`,
                  cursor: 'pointer'
                }}
              >
                <Sun size={16} /> Light
              </button>
              <button 
                onClick={() => setTheme('dark')}
                style={{ 
                  padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                  background: theme === 'dark' ? 'var(--color-clear)' : 'transparent',
                  color: theme === 'dark' ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${theme === 'dark' ? 'var(--color-clear)' : 'var(--border-color)'}`,
                  cursor: 'pointer'
                }}
              >
                <Moon size={16} /> Dark
              </button>
              <button 
                onClick={() => setTheme('system')}
                style={{ 
                  padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                  background: theme === 'system' ? 'var(--color-clear)' : 'transparent',
                  color: theme === 'system' ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${theme === 'system' ? 'var(--color-clear)' : 'var(--border-color)'}`,
                  cursor: 'pointer'
                }}
              >
                <Monitor size={16} /> System
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Telemetry & Units</h2>
          <div className="settings-row">
            <div>
              <strong>Temperature Unit</strong>
            </div>
            <select style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '4px' }}>
              <option>&deg;C (Celsius)</option>
              <option>&deg;F (Fahrenheit)</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <strong>Wind Speed</strong>
            </div>
            <select style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '4px' }}>
              <option>km/h</option>
              <option>mph</option>
              <option>knots</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
