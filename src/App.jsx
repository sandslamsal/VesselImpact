import { useState } from 'react'
import { Ship, Container, BarChart3 } from 'lucide-react'
import './App.css'
import { ShipImpact } from './components/ShipImpact.jsx'
import { BargeImpact } from './components/BargeImpact.jsx'
import { RiskAnalysis } from './components/RiskAnalysis.jsx'

const MODES = [
  { key: 'ship', label: 'Ship Impact', sub: 'Arts. 3.14.7–3.14.10', icon: Ship },
  { key: 'barge', label: 'Barge Impact', sub: 'Arts. 3.14.11–3.14.12', icon: Container },
  { key: 'risk', label: 'Annual Frequency', sub: 'Art. 3.14.5 · Method II', icon: BarChart3 },
]

export default function App() {
  const [mode, setMode] = useState('ship')

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">
              <svg viewBox="0 0 64 64" width="38" height="38" aria-hidden="true">
                <rect width="64" height="64" rx="14" fill="#0f1b28" />
                <rect x="42" y="12" width="9" height="38" rx="1.5" fill="#cdd6e0" stroke="#5b6673" strokeWidth="1.3" />
                <rect x="34" y="7" width="24" height="6.5" rx="1.6" fill="#8b97a6" />
                <path d="M7 30 L29 30 L37 36.5 L33.5 44 L11 44 Z" fill="#e8453c" stroke="#a33028" strokeWidth="1.3" />
                <rect x="12.5" y="22.5" width="10" height="7.5" rx="1" fill="#f4b740" />
                <path d="M38.5 31.5 l4.5 -3.2 -1.7 4.4 4.4 1.1 -4.4 2.2 1.7 4.4 -4.5 -3.3" fill="#f4b740" />
                <path d="M5 51 C11 47.5, 17 47.5, 23 51 S35 54.5, 41 51 S53 47.5, 59 51" fill="none" stroke="#3ba9d4" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M5 57 C11 54, 17 54, 23 57 S35 60, 41 57 S53 54, 59 57" fill="none" stroke="#2b7fb0" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              </svg>
            </span>
            <div>
              <h1>Vessel Impact</h1>
              <p className="header-sub">
                Vessel collision design forces for bridge piers and
                superstructures — ship impact, barge impact, and Method II
                annual frequency of collapse per AASHTO LRFD Bridge Design
                Specifications, 9th Edition, Section 3.14.
              </p>
            </div>
          </div>
        </div>
        <div className="header-wave" aria-hidden="true">
          <svg viewBox="0 0 1200 22" preserveAspectRatio="none">
            <path d="M0 14 C 90 4, 210 24, 300 14 S 510 4, 600 14 S 810 24, 900 14 S 1110 4, 1200 14 L 1200 22 L 0 22 Z" fill="rgba(59,169,212,0.16)" />
            <path d="M0 17 C 120 8, 240 26, 360 17 S 600 8, 720 17 S 960 26, 1080 17 L 1200 12 L 1200 22 L 0 22 Z" fill="rgba(59,169,212,0.22)" />
          </svg>
        </div>
      </header>

      <main className="app-shell">
        <div className="mode-toggle" role="tablist">
          {MODES.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={mode === m.key}
                className={`mode-toggle-button ${mode === m.key ? 'mode-toggle-active' : ''}`}
                onClick={() => setMode(m.key)}
              >
                <Icon size={17} className="mode-icon" />
                <span className="mode-text">
                  <span className="mode-label">{m.label}</span>
                  <span className="mode-sub">{m.sub}</span>
                </span>
              </button>
            )
          })}
        </div>

        {mode === 'ship' ? <ShipImpact /> : mode === 'barge' ? <BargeImpact /> : <RiskAnalysis />}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-brand">Vessel Impact</span>
          <span className="footer-dot">·</span>
          <span>AASHTO LRFD Bridge Design Specifications — Section 3.14 Vessel Collision</span>
          <a href="https://sandeshlamsal.com/apps/" className="footer-link">
            sandeshlamsal.com/apps
          </a>
        </div>
      </footer>
    </>
  )
}
