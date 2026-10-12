import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, Sparkles } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getProductById, getPriceHistory } from '../services/mockApi.js'
import { rs } from '../components/ProductCard.jsx'
import { useApp } from '../App.jsx'

export default function ProductDetails() {
  const { id } = useParams()
  const { say } = useApp()
  const [p, setP] = useState(undefined), [hist, setHist] = useState(null), [err, setErr] = useState(false)
  useEffect(() => {
    setP(undefined); setHist(null); setErr(false)
    getProductById(id).then(setP).catch(() => setErr(true))
    getPriceHistory(id).then(setHist).catch(() => setErr(true))
  }, [id])
  if (err) return <div className="wrap empty"><h2>Something went wrong.</h2><p className="muted">FashionOptix couldn't reach the backend. Run <code>python app.py</code> in the backend folder, then reload.</p><Link className="btn" to="/">Go Home</Link></div>
  if (p === undefined) return <div className="wrap"><div className="card skeleton tall" /></div>
  if (!p) return <div className="wrap empty"><h2>Something went wrong.</h2><p>FashionOptix couldn't load this product.</p><Link className="btn" to="/">Go Home</Link></div>
  const prices = hist?.map(h => h.price) || [], hi = Math.max(...prices), lo = Math.min(...prices)
  const genuine = hist && p.price <= hi * 0.9
  return (
    <div className="wrap pdp">
      <div className="card thumb big"><span className="ph">{p.brand}</span></div>
      <div>
        <small className="muted">{p.brand}</small><h1 className="h2">{p.name}</h1>
        <div className="row"><strong className="big">{rs(p.price)}</strong><s className="muted">{rs(p.originalPrice)}</s><span className="pill accent">{p.discount}% off</span></div>
        <p className="muted">{p.availability} · ★ {p.rating} ({p.reviews} reviews) · {p.material}</p>
        <div className="card pad"><b>AI Quality Score <span className="pill">Sample Analysis</span></b><div className="score">{p.qualityScore}<small>/100</small></div>
          {Object.entries(p.breakdown).map(([k, v]) => <div key={k} className="bar"><span>{k}</span><i><em style={{ width: Math.min(v, 100) + '%' }} /></i><b>{Math.min(v, 100)}%</b></div>)}
          <small className="muted">Based on AI analysis of customer reviews (demo data).</small></div>
        <a className="btn wide" href="#" onClick={e => { e.preventDefault(); say('Opens the official brand website in production') }}>View on Brand Website <ExternalLink size={15} /></a>
        <button className="btn ghost wide" onClick={() => say('Price alert created')}>Create Price Alert</button>
      </div>
      <div className="card pad"><b>6-Month Price History</b>
        {!hist ? <div className="skeleton tall" /> : <>
          <div style={{ height: 240 }}><ResponsiveContainer><AreaChart data={hist}><XAxis dataKey="month" /><YAxis domain={['auto', 'auto']} width={56} tickFormatter={v => v / 1000 + 'k'} /><Tooltip formatter={v => rs(v)} />
            <Area dataKey="price" stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
          <p className="muted">Current {rs(p.price)} · Lowest {rs(lo)} · Highest {rs(hi)}</p>
          <p className="insight"><Sparkles size={14} /> {genuine ? `Current price is ${Math.round((1 - p.price / hi) * 100)}% below the 6-month high.` : 'Price has stayed close to its usual level; this discount may not be significant.'}</p></>}
      </div>
      <div className="card pad"><b>Sale Authenticity <span className="pill">Prototype Analysis</span></b>
        <h3>{genuine ? '✓ Likely Genuine' : '⚠ Price recently increased before discount'}</h3><p className="muted">Compared against sample 6-month history. No real model is running yet.</p></div>
    </div>)
}
