import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchProducts } from '../services/mockApi.js'
import ProductCard from '../components/ProductCard.jsx'

const sorts = { Relevance: () => 0, 'Price: Low to High': (a, b) => a.price - b.price, 'Price: High to Low': (a, b) => b.price - a.price, 'Highest Quality': (a, b) => b.qualityScore - a.qualityScore, 'Biggest Discount': (a, b) => b.discount - a.discount, 'Best Rating': (a, b) => b.rating - a.rating }
export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [text, setText] = useState(q)
  const [data, setData] = useState(null)
  const [sort, setSort] = useState('Relevance')
  const [brands, setBrands] = useState([])
  const [minQ, setMinQ] = useState(0)
  const [err, setErr] = useState(false)
  useEffect(() => {
    setText(q); setData(null); setErr(false)
    searchProducts(q).then(setData).catch(() => setErr(true))
    if (q) {
      const recent = JSON.parse(localStorage.getItem('fo-recent-searches') || '[]')
      localStorage.setItem('fo-recent-searches', JSON.stringify([q, ...recent.filter(r => r !== q)].slice(0, 8)))
    }
  }, [q])
  const items = data ? data.items.filter(p => (!brands.length || brands.includes(p.brand)) && p.qualityScore >= minQ).sort(sorts[sort]) : []
  const all = data ? [...new Set(data.items.map(p => p.brand))] : []
  const f = data?.filters || {}
  return (
    <div className="wrap">
      <form className="searchbox" onSubmit={e => { e.preventDefault(); setParams({ q: text }) }} role="search">
        <input aria-label="Search" value={text} onChange={e => setText(e.target.value)} placeholder="white polo under Rs. 4000" /><button className="btn">Search</button>
      </form>
      {data && (f.color || f.category || f.maxPrice) && <div className="card pad ai"><b>AI understanding <span className="pill">Prototype parser</span></b>
        <div className="pills">{f.category && <span className="pill">Category: {f.category}</span>}{f.color && <span className="pill">Color: {f.color}</span>}{f.maxPrice && <span className="pill">Price: under Rs. {f.maxPrice.toLocaleString()}</span>}</div></div>}
      <div className="layout">
        <aside className="card pad filters" aria-label="Filters">
          <h3>Filters</h3><b>Brand</b>
          {all.map(b => <label key={b}><input type="checkbox" checked={brands.includes(b)} onChange={() => setBrands(x => x.includes(b) ? x.filter(y => y !== b) : [...x, b])} /> {b}</label>)}
          <label><b>Minimum quality: {minQ}</b><input type="range" min="0" max="95" step="5" value={minQ} onChange={e => setMinQ(+e.target.value)} /></label>
        </aside>
        <section>
          <div className="row between"><p>{data ? `${items.length} products found across ${new Set(items.map(p => p.brand)).size} brands` : err ? 'Backend not reachable' : 'Searching brands...'}</p>
            <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value)}>{Object.keys(sorts).map(s => <option key={s}>{s}</option>)}</select></div>
          {err && <div className="empty"><h3>Something went wrong.</h3><p className="muted">FashionOptix couldn't reach the backend. Run <code>python app.py</code> in the backend folder, then reload.</p></div>}
          {!data && !err && <div className="grid4 tight">{[0, 1, 2].map(i => <div key={i} className="card skeleton" />)}</div>}
          {data && items.length === 0 && <div className="empty"><h3>We couldn't find an exact match.</h3><Link to="/search" className="btn">Try Broader Search</Link></div>}
          {data && <div className="grid4 tight">{items.map(p => <ProductCard key={p.id} product={p} />)}</div>}
        </section>
      </div>
    </div>)
}
