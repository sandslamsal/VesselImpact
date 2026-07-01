import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { SelectField } from './shared.jsx'

// Shared "Report & Export" card: project metadata + PDF download button.
export function ReportCard({ onGenerate }) {
  const [proj, setProj] = useState({ name: '', engineer: '' })
  const [includeLogo, setIncludeLogo] = useState(true)
  const [pageSize, setPageSize] = useState('letter')
  const [msg, setMsg] = useState('')

  const handlePdf = async () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    try {
      await onGenerate({ project: proj, pageSize, dateStr, includeLogo })
      setMsg('PDF report downloaded.')
    } catch (e) {
      setMsg(`PDF failed: ${e.message}`)
    }
  }

  return (
    <section className="toolbar-card">
      <div className="results-head">
        <FileDown size={18} />
        <div>
          <h3>Report & Export</h3>
          <p>Project details appear on the PDF report. All equations, clause, and figure numbers are cited.</p>
        </div>
      </div>
      <div className="field-grid">
        <label className="field">
          <span className="field-label">Project name</span>
          <input className="field-input" type="text" placeholder="optional" value={proj.name} onChange={(e) => setProj((p) => ({ ...p, name: e.target.value }))} />
        </label>
        <label className="field">
          <span className="field-label">Prepared by</span>
          <input className="field-input" type="text" placeholder="optional" value={proj.engineer} onChange={(e) => setProj((p) => ({ ...p, engineer: e.target.value }))} />
        </label>
        <label className="field field-check">
          <span className="field-label">Report logo</span>
          <label className="check-inline">
            <input type="checkbox" checked={includeLogo} onChange={(e) => setIncludeLogo(e.target.checked)} />
            <span>Include VesselImpactX logo</span>
          </label>
        </label>
        <SelectField label="Page size" value={pageSize} onChange={setPageSize} options={['letter', 'a4']} />
      </div>
      <div className="action-cluster">
        <button className="button button-primary" type="button" onClick={handlePdf}>
          <FileDown size={16} />
          <span>Download PDF report</span>
        </button>
        {msg ? <span className="action-message">{msg}</span> : null}
      </div>
    </section>
  )
}
