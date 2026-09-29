"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, Layers, GitMerge, Zap, Brain, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ModelsPage() {
  const shapFeatures = [
    { feature: "Convective Available Potential Energy (CAPE)", importance: 38, category: "Thermodynamics", color: "#E53E3E" },
    { feature: "Radar Reflectivity Surge (dBZ/10min)", importance: 26, category: "Doppler Radar", color: "#3182CE" },
    { feature: "Cloud-Top Glaciation (TIR Brightness Temp)", importance: 18, category: "INSAT-3DS Satellite", color: "#805AD5" },
    { feature: "Bulk Wind Shear (0-6 km)", importance: 11, category: "Kinematics", color: "#F59E0B" },
    { feature: "Surface Equivalent Potential Temp (Theta-E)", importance: 7, category: "Boundary Layer", color: "#10B981" },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1200px', padding: '40px 24px 80px' }}>
      <Link href="/" className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', textDecoration: 'none' }}>
        <ArrowLeft size={18} /> Back to Command Center
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '28px' }}>Model Architecture & Explainable AI (XAI)</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Deep learning multimodal fusion pipeline with thermodynamic constraints and SHAP attribution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(74, 144, 226, 0.2)', color: 'var(--color-clear)', borderRadius: '6px', fontWeight: 'bold' }}>
            ONNX Runtime 1.18 &bull; FP16 Optimized
          </span>
        </div>
      </div>

      {/* Model Fusion Architecture Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '28px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Layers size={22} color="var(--color-precip)" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>1. Multimodal Encoders</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Three independent spatial encoder heads extract multi-scale representations:
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Radar Stream:</strong> 3D U-Net encoder processing Doppler sweeps (Z, V, W).</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Satellite Stream:</strong> ResNet-34 encoder for INSAT-3DS TIR1, TIR2, and WV.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Thermodynamics:</strong> Multi-layer CNN processing gridded ERA5 physics tensors.</li>
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <GitMerge size={22} color="var(--color-warning)" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>2. Cross-Attention Fusion</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Multi-head cross-attention dynamically weights modalities based on atmospheric conditions:
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Suppresses radar false echoes when CAPE &lt; 500 J/kg.</li>
            <li>Amplifies satellite cloud-top cooling signals when radar is in cone-of-silence.</li>
            <li>Learns joint spatiotemporal correlation across time steps.</li>
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Zap size={22} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>3. Physics Residual Engine</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Hybrid physics-AI approach prevents storm hallucination:
          </p>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', color: '#10B981', margin: '8px 0' }}>
            Z(t+Δt) = Advect_OpticalFlow(Z_t) + Residual_AI(Tensor_t)
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Deterministic advection handles motion; the AI only learns non-linear cell growth, decay, and splitting.
          </p>
        </div>
      </div>

      {/* SHAP Feature Attribution Breakdown */}
      <div className="glass-panel" style={{ padding: '28px', marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>Explainability: Global SHAP Feature Importance</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Proves what drives the AI's severe storm and tornadic vortex predictions.
            </p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sampled over 50,000 grids</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {shapFeatures.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.feature}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '10px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>
                    {item.category}
                  </span>
                </div>
                <span style={{ fontWeight: 'bold', color: item.color }}>{item.importance}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${item.importance * 2.2}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
