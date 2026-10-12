import { useEffect, useState } from 'react'
import { Bell, TrendingDown, PackageCheck, Trash2, Sparkles } from 'lucide-react'
import { getAlerts, getProducts, createAlert, removeAlert } from '../services/mockApi.js'
import { rs } from '../components/ProductCard.jsx'
import { useApp } from '../App.jsx'

export default function Alerts() {
  const { say } = useApp()
  const [alerts, setAlerts] = useState(null)
  const [products, setProducts] = useState([])
  const [pick, setPick] = useState('')
  const [kind, setKind] = useState('price-drop')
  const load = () => getAlerts().then(setAlerts).catch(() => setAlerts([]))
  useEffect(() => { load(); getProducts().then(setProducts).catch(() => {}) }, [])
  if (!alerts) return <div className="wrap"><div className="card skeleton" /></div>
  const drops = alerts.filter(a => a.kind === 'price-drop')
  const restocks = alerts.filter(a => a.kind === 'restock')

  const add = () => {
    if (!pick) return
    createAlert(+pick, kind).then(() => { say('Price alert created'); load() }).catch(() => say('Backend not reachable'))
  }
  const remove = id => removeAlert(id).then(load)

  return (
    <div className="wrap">
      <h1 className="h2">Alerts</h1>
      <div className="card pad row">
        <select value={pick} onChange={e => setPick(e.target.value)}><option value="">Select a product…</option>{products.map(p => <option key={p.id} value={p.id}>{p.brand} — {p.name}</option>)}</select>
        <select value={kind} onChange={e => setKind(e.target.value)}><option value="price-drop">Price drop</option><option value="restock">Restock</option></select>
        <button className="btn" onClick={add}>Create Alert</button>
      </div>

      <h2>Price Drop Alerts</h2>
      {!drops.length && <div className="card pad"><p className="muted">No active alerts.</p></div>}
      <div className="grid3">{drops.map(a => <div key={a.id} className="card pad">
        <b>{a.product.brand}</b><p className="muted">{a.product.name}</p>
        <p><s className="muted">{rs(a.product.originalPrice)}</s> → <strong>{rs(a.product.price)}</strong></p>
        <span className="pill accent">{a.product.discount}% drop</span>
        <button className="icon" aria-label="Remove alert" onClick={() => remove(a.id)}><Trash2 size={14} /></button>
      </div>)}</div>

      <h2>Restock Alerts</h2>
      {!restocks.length && <div className="card pad"><p className="muted">No restock alerts yet.</p></div>}
      <div className="grid3">{restocks.map(a => <div key={a.id} className="card pad">
        <b>{a.product.brand}</b><p className="muted">{a.product.name}</p><span className="pill"><PackageCheck size={13} /> Back in stock</span>
        <button className="icon" aria-label="Remove alert" onClick={() => remove(a.id)}><Trash2 size={14} /></button>
      </div>)}</div>

      <div className="card pad"><b><Sparkles size={14} /> Price Forecast <span className="pill">Prototype Analysis</span></b>
        <p className="insight"><TrendingDown size={14} /> Potential price drop in 5–8 days for items on your watchlist (demo forecast, not a trained model).</p></div>
    </div>)
}
