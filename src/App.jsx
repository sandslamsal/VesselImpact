import { useState } from 'react'
import { Ship, Container, BarChart3 } from 'lucide-react'
import './App.css'
import { ShipImpact } from './components/ShipImpact.jsx'
import { BargeImpact } from './components/BargeImpact.jsx'
import { RiskAnalysis } from './components/RiskAnalysis.jsx'

const MODES = [
  { key: 'ship', label: 'Ship Impact', icon: Ship },
  { key: 'barge', label: 'Barge Impact', icon: Container },
  { key: 'risk', label: 'Annual Frequency', icon: BarChart3 },
]

export default function App() {
  const [mode, setMode] = useState('ship')

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">
              <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
                <rect width="64" height="64" rx="13" fill="#14202e" />
                <rect x="41" y="14" width="9" height="36" rx="1.5" fill="#c3cdd9" stroke="#5b6673" strokeWidth="1.4" />
                <rect x="34" y="9" width="23" height="6" rx="1.5" fill="#8b97a6" />
                <path d="M6 40 C12 36, 18 36, 24 40 S36 44, 42 40" fill="none" stroke="#3ba9d4" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M8 30 L30 30 L37 36 L34 43 L11 43 Z" fill="#e8453c" stroke="#a33028" strokeWidth="1.4" />
                <rect x="13" y="23" width="10" height="7" rx="1" fill="#f4b740" />
                <path d="M38 32 l4 -3 -1.5 4 4 1 -4 2 1.5 4 -4 -3" fill="#f4b740" />
              </svg>
            </span>
            <div>
              <h1>VesselImpactX</h1>
              <p className="header-sub">
                Vessel collision design forces for bridge piers and
                superstructures — ship impact, barge impact, and Method II
                annual frequency of collapse. AASHTO LRFD Bridge Design
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
        <div className="mode-toggle">
          {MODES.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.key}
                type="button"
                className={`mode-toggle-button ${mode === m.key ? 'mode-toggle-active' : ''}`}
                onClick={() => setMode(m.key)}
              >
                <Icon size={16} />
                <span>{m.label}</span>
              </button>
            )
          })}
        </div>

        {mode === 'ship' ? <ShipImpact /> : mode === 'barge' ? <BargeImpact /> : <RiskAnalysis />}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>VesselImpactX</span>
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
