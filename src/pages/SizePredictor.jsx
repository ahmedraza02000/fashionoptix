import { useState } from 'react'
import { Sparkles, Ruler } from 'lucide-react'
import { BRANDS } from '../data/brands.js'
import { predictSize, saveProfile, isBackendError } from '../services/mockApi.js'
import { useApp } from '../App.jsx'

const TYPES = ['Menswear', 'Womenswear', 'Unisex']
export default function SizePredictor() {
  const { say, user } = useApp()
  const [step, setStep] = useState(0)
  const [type, setType] = useState('Menswear')
  const [m, setM] = useState({ height: 175, weight: 70, chest: 96, waist: 82, hip: 98, shoulder: 45 })
  const [brands, setBrands] = useState(['Sapphire', 'Khaadi', 'J.'])
  const [result, setResult] = useState(null)
  const [err, setErr] = useState(false)
  const set = k => e => setM(s => ({ ...s, [k]: +e.target.value }))
  const toggleBrand = b => setBrands(s => s.includes(b) ? s.filter(x => x !== b) : [...s, b])

  const finish = () => {
    setErr(false)
    localStorage.setItem('fo-measurements', JSON.stringify({ type, ...m }))
    if (user) saveProfile(m).catch(() => {}) // best-effort sync to the account
    predictSize({ ...m, brands }).then(r => { setResult(r); setStep(3) })
      .catch(e => { setErr(true); if (isBackendError(e)) say('Backend not reachable') })
  }

  return (
    <div className="wrap narrow">
      <h1 className="h2">Find Your Perfect Fit Across Brands.</h1>
      <p className="muted">Recommendations are based on your measurements and brand-specific size charts.</p>
      <div className="pills">{['Type', 'Measurements', 'Brands', 'Result'].map((s, i) => <span key={s} className={'pill' + (i === step ? ' accent' : '')}>{i + 1}. {s}</span>)}</div>

      {step === 0 && <div className="card pad">
        <h3>Clothing type</h3>
        <div className="pills">{TYPES.map(t => <button key={t} className={'pill btnlike' + (type === t ? ' accent' : '')} onClick={() => setType(t)}>{t}</button>)}</div>
        <button className="btn" onClick={() => setStep(1)}>Continue</button>
      </div>}

      {step === 1 && <div className="card pad">
        <h3>Body measurements (cm / kg)</h3>
        <div className="grid3 formgrid">
          {[['height', 'Height (cm)'], ['weight', 'Weight (kg)'], ['chest', 'Chest'], ['waist', 'Waist'], ['hip', 'Hip'], ['shoulder', 'Shoulder']].map(([k, label]) =>
            <label key={k}>{label}<input type="number" value={m[k]} onChange={set(k)} /></label>)}
        </div>
        <div className="row"><button className="btn ghost" onClick={() => setStep(0)}>Back</button><button className="btn" onClick={() => setStep(2)}>Continue</button></div>
      </div>}

      {step === 2 && <div className="card pad">
        <h3>Select brands to check</h3>
        <div className="pills">{BRANDS.map(b => <button key={b} className={'pill btnlike' + (brands.includes(b) ? ' accent' : '')} onClick={() => toggleBrand(b)}>{b}</button>)}</div>
        <div className="row"><button className="btn ghost" onClick={() => setStep(1)}>Back</button>
          <button className="btn" disabled={!brands.length} onClick={finish}>Analyze My Fit</button></div>
        {err && <p className="muted">Backend not reachable — start the Python server and try again.</p>}
      </div>}

      {step === 3 && result && <div className="card pad">
        <b><Ruler size={16} /> Your Recommended Size <span className="pill">Prototype Analysis</span></b>
        {result.results.map(r => <div key={r.brand} className="bar"><span>{r.brand}</span><i><em style={{ width: r.confidence + '%' }} /></i><b>{r.size}</b></div>)}
        <p className="insight"><Sparkles size={14} /> Overall confidence {result.overallConfidence}%.</p>
        <button className="btn ghost" onClick={() => setStep(0)}>Start Over</button>
      </div>}
    </div>)
}
