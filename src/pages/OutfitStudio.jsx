import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { generateOutfit, isBackendError } from '../services/mockApi.js'
import { rs } from '../components/ProductCard.jsx'
import { useApp } from '../App.jsx'

const OCCASIONS = ['Casual', 'Formal', 'Festive', 'Sport']
const STYLES = ['Minimal', 'Classic', 'Bold', 'Streetwear']
export default function OutfitStudio() {
  const { say } = useApp()
  const [prefs, setPrefs] = useState({ occasion: 'Casual', style: 'Minimal', budget: 10000, gender: 'Unisex' })
  const [outfit, setOutfit] = useState(null)
  const [loading, setLoading] = useState(false)

  const build = () => {
    setLoading(true)
    generateOutfit(prefs).then(r => { setOutfit(r); setLoading(false) })
      .catch(e => { setLoading(false); if (isBackendError(e)) say('Backend not reachable') })
  }
  return (
    <div className="wrap narrow">
      <h1 className="h2">Build Your Look.</h1>
      <p className="muted">Choose preferences and generate a coordinated outfit from the demo catalog.</p>
      <div className="card pad grid3 formgrid">
        <label>Occasion<select value={prefs.occasion} onChange={e => setPrefs(p => ({ ...p, occasion: e.target.value }))}>{OCCASIONS.map(o => <option key={o}>{o}</option>)}</select></label>
        <label>Style<select value={prefs.style} onChange={e => setPrefs(p => ({ ...p, style: e.target.value }))}>{STYLES.map(o => <option key={o}>{o}</option>)}</select></label>
        <label>Budget (Rs.)<input type="number" value={prefs.budget} onChange={e => setPrefs(p => ({ ...p, budget: +e.target.value }))} /></label>
      </div>
      <button className="btn" onClick={build} disabled={loading}>{loading ? 'Styling...' : 'Generate Outfit'}</button>

      {outfit && <div className="card pad">
        <b>Your Outfit <span className="pill">Prototype Analysis</span></b>
        <div className="grid3">{outfit.items.map(i => <div key={i.slot} className="card pad">
          <small className="muted">{i.slot}</small><h3>{i.product.brand}</h3><p className="muted">{i.product.name}</p><b>{rs(i.product.price)}</b>
        </div>)}</div>
        <div className="row between"><b>Total: {rs(outfit.total)}</b><span className={'pill' + (outfit.withinBudget ? '' : ' warn')}>{outfit.withinBudget ? 'Within budget' : 'Over budget'}</span></div>
        <p className="insight"><Sparkles size={14} /> {outfit.note}</p>
      </div>}
    </div>)
}
