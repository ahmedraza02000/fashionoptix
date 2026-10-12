import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { getProductById, getPriceHistory, getSaleAuthenticity } from '../services/mockApi.js'
import { rs } from '../components/ProductCard.jsx'
import { useApp } from '../App.jsx'

const ROWS = [
  ['Brand', p => p.brand],
  ['Price', p => rs(p.price), 'min'],
  ['Discount', p => p.discount + '%', 'max'],
  ['Rating', p => p.rating, 'max'],
  ['Quality Score', p => p.qualityScore, 'max'],
  ['Material', p => p.material],
  ['Color', p => p.color],
  ['Availability', p => p.availability],
  ['Shrinkage Risk', p => p.breakdown['Shrinkage resistance'] > 80 ? 'Low' : 'Medium'],
  ['Color Fading Risk', p => p.breakdown['Color retention'] > 85 ? 'Low' : 'Medium'],
  ['Sale Authenticity', p => p.authenticity?.verdict || '—'],
]
export default function Compare() {
  const { compare, toggle } = useApp()
  const [products, setProducts] = useState(null)
  useEffect(() => {
    if (!compare.length) { setProducts([]); return }
    Promise.all(compare.map(async id => {
      const [p, hist, auth] = await Promise.all([getProductById(id), getPriceHistory(id), getSaleAuthenticity(id)])
      return { ...p, authenticity: auth, hist }
    })).then(setProducts)
  }, [compare])

  if (products === null) return <div className="wrap"><div className="card skeleton" /></div>
  if (!products.length) return <div className="wrap empty"><h2>Nothing to compare yet.</h2><p className="muted">Use the compare icon on a product card to add up to 4 items.</p><Link className="btn" to="/search">Explore Products</Link></div>

  const best = (row) => {
    if (!row[2]) return null
    const vals = products.map(row[1])
    return row[2] === 'max' ? Math.max(...vals) : Math.min(...vals.map(v => typeof v === 'string' ? parseFloat(v) : v))
  }
  const bestProduct = products.reduce((a, b) => a.qualityScore > b.qualityScore ? a : b)
  const cheapest = products.reduce((a, b) => a.price < b.price ? a : b)

  return (
    <div className="wrap">
      <h1 className="h2">Compare Products</h1>
      <div className="compare-table">
        <table>
          <thead><tr><th></th>{products.map(p => <th key={p.id}><Link to={`/product/${p.id}`}>{p.name}</Link><button className="icon sm" onClick={() => toggle('compare', p.id, 'Comparison')}><X size={13} /></button></th>)}</tr></thead>
          <tbody>{ROWS.map(row => {
            const b = best(row)
            return <tr key={row[0]}><td>{row[0]}</td>{products.map(p => {
              const raw = row[1](p)
              const isBest = row[2] && (typeof raw === 'string' ? parseFloat(raw) : raw) === b
              return <td key={p.id} className={isBest ? 'best' : ''}>{raw}</td>
            })}</tr>
          })}</tbody>
        </table>
      </div>
      <div className="card pad"><b><Sparkles size={14} /> AI Comparison Summary <span className="pill">Prototype Analysis</span></b>
        <p className="muted">{bestProduct.name} ({bestProduct.brand}) has the strongest quality score at {bestProduct.qualityScore}/100, while {cheapest.name} ({cheapest.brand}) currently offers the lowest price at {rs(cheapest.price)}.</p></div>
    </div>)
}
