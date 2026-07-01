// Renders a self-contained SVG figure string (from utils/figures.js).
export function Figure({ svg }) {
  return <div className="vix-figure" dangerouslySetInnerHTML={{ __html: svg }} />
}
