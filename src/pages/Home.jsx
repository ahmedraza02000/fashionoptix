import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Camera, Sparkles, LineChart, Ruler, Bell, ScanSearch } from 'lucide-react'
import { getProducts } from '../services/mockApi.js'
import ProductCard from '../components/ProductCard.jsx'
import { BRANDS as brands } from '../data/brands.js'

const features = [
  [Search, 'Cross-Brand Search', 'Compare products from 10+ Pakistani fashion brands in one place.', '/search'],
  [Sparkles, 'AI Quality Score', 'Understand what customers say about fabric, shrinkage and color fading.', '/search'],
  [LineChart, 'Real Price History', 'See how prices changed over the last 3–6 months.', '/price-intelligence'],
  [Ruler, 'Smart Size Prediction', 'Find your recommended size across different brands.', '/size-predictor'],
  [ScanSearch, 'Visual Search', 'Upload an image and discover visually similar fashion.', '/visual-search'],
  [Bell, 'Smart Alerts', 'Know when favorites drop in price or return to stock.', '/alerts'],
]
export default function Home() {
  const [q, setQ] = useState('')
  const [trending, setTrending] = useState(null)
  const nav = useNavigate()
  useEffect(() => { getProducts().then(p => setTrending(p.slice(0, 4))).catch(() => setTrending([])) }, [])
  const go = e => { e.preventDefault(); nav('/search?q=' + encodeURIComponent(q || 'white polo under 4000')) }
  return (<>
    <section className="wrap hero">
      <div>
        <h1>Shop Smarter Across Every Brand.</h1>
        <p className="lead">Compare fashion products, analyze quality, track real prices, find your perfect size, and discover styles across Pakistan's leading brands — all in one place.</p>
        <form className="searchbox" onSubmit={go} role="search">
          <Sparkles size={18} />
          <input aria-label="Search fashion" value={q} onChange={e => setQ(e.target.value)} placeholder="Search for shirts, dresses, sneakers, polos..." />
          <button type="button" className="icon" aria-label="Search by image" onClick={() => nav('/visual-search')}><Camera size={18} /></button>
          <button className="btn">Search</button>
        </form>
        <p className="muted">Try: <button className="link" onClick={() => nav('/search?q=white oversized polo under 4000')}>White oversized polo under Rs. 4,000</button></p>
      </div>
      <div className="stack" aria-hidden="true">
        <div className="card float a"><small className="muted">Sapphire · Premium Cotton Polo</small><strong>Rs. 2,990</strong><small className="muted">was Rs. 4,200</small></div>
        <div className="card float b"><small className="muted">AI Quality Score · Preview</small><strong className="big">89/100</strong></div>
        <div className="card float c"><small className="muted">Recommended size</small><strong>M · 91% fit</strong></div>
      </div>
    </section>
    <section className="wrap"><h2>Supported Brands</h2><div className="pills">{brands.map(b => <span key={b} className="pill">{b}</span>)}</div>
      <p className="muted">Sample catalog for the Phase 1 prototype. No live brand connection yet.</p></section>
    <section className="wrap"><h2>Everything You Need Before You Buy.</h2>
      <div className="grid3">{features.map(([I, t, d, to]) => <Link to={to} className="card pad featurelink" key={t}><I size={20} /><h3>{t}</h3><p className="muted">{d}</p></Link>)}</div></section>
    <section className="wrap"><h2>Trending Across Pakistan</h2>
      <div className="grid4">
        {trending === null && [0, 1, 2, 3].map(i => <div key={i} className="card skeleton" />)}
        {trending?.length === 0 && <p className="muted">Backend not reachable — run the Python server to see live trending products.</p>}
        {trending?.map(p => <ProductCard key={p.id} product={p} />)}
      </div></section>
    <section className="wrap"><h2>How FashionOptix Works</h2>
      <ol className="grid4 steps">{[['Search', 'Search across multiple fashion brands.'], ['Analyze', 'AI analyzes price, quality, reviews and sizing.'], ['Compare', 'Compare products using transparent data.'], ['Decide', 'Visit the official brand website to purchase.']].map(([t, d], i) => <li key={t} className="card pad"><b>{i + 1}. {t}</b><p className="muted">{d}</p></li>)}</ol></section>
  </>)
}
