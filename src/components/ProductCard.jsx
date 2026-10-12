import { Link } from 'react-router-dom'
import { Heart, GitCompare, Sparkles, Star } from 'lucide-react'
import { useApp } from '../App.jsx'

export const rs = n => 'Rs. ' + n.toLocaleString('en-PK')

export default function ProductCard({ product: p }) {
  const { wishlist, compare, toggle } = useApp()
  const saved = wishlist.includes(p.id), comparing = compare.includes(p.id)
  return (
    <article className="card product">
      <Link to={`/product/${p.id}`} className="thumb" aria-label={`View ${p.name}`}>
        {p.image ? <img src={p.image} alt={p.name} loading="lazy" onError={e => (e.currentTarget.style.display = 'none')} />
          : <span className="ph">{p.brand}</span>}
        {p.discount > 0 && <span className="pill accent">{p.discount}% off</span>}
      </Link>
      <div className="actions">
        <button aria-label="Toggle wishlist" aria-pressed={saved} className={saved ? 'on' : ''} onClick={() => toggle('wishlist', p.id, 'Wishlist')}><Heart size={16} /></button>
        <button aria-label="Toggle compare" aria-pressed={comparing} className={comparing ? 'on' : ''} onClick={() => toggle('compare', p.id, 'Comparison')}><GitCompare size={16} /></button>
      </div>
      <div className="body">
        <small className="muted">{p.brand}</small>
        <h3>{p.name}</h3>
        <div className="row"><strong>{rs(p.price)}</strong>{p.discount > 0 && <s className="muted">{rs(p.originalPrice)}</s>}</div>
        <div className="row muted"><span>Quality <b>{p.qualityScore}/100</b></span><span><Star size={13} fill="currentColor" /> {p.rating}</span></div>
        <p className="insight"><Sparkles size={13} /> {p.insight}</p>
      </div>
    </article>
  )
}
