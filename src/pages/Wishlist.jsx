import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, GitCompare, Bell, Trash2 } from 'lucide-react'
import { getProducts, createAlert } from '../services/mockApi.js'
import { rs } from '../components/ProductCard.jsx'
import { useApp } from '../App.jsx'

export default function Wishlist() {
  const { wishlist, toggle, say } = useApp()
  const [products, setProducts] = useState(null)
  useEffect(() => { getProducts().then(setProducts).catch(() => setProducts([])) }, [])
  if (!products) return <div className="wrap"><div className="card skeleton" /></div>
  const items = products.filter(p => wishlist.includes(p.id))
  if (!items.length) return <div className="wrap empty"><h2>Your wishlist is empty.</h2><p className="muted">Save products to track their prices.</p><Link className="btn" to="/search">Explore Products</Link></div>
  return (
    <div className="wrap">
      <h1 className="h2">Wishlist</h1>
      <div className="grid3">{items.map(p => (
        <div key={p.id} className="card pad">
          <b>{p.brand}</b><p className="muted">{p.name}</p>
          <div className="row between"><strong>{rs(p.price)}</strong><s className="muted">{rs(p.originalPrice)}</s></div>
          <p className="muted">Quality {p.qualityScore}/100</p>
          <div className="row">
            <button className="icon" aria-label="Remove from wishlist" onClick={() => toggle('wishlist', p.id, 'Wishlist')}><Trash2 size={15} /></button>
            <button className="icon" aria-label="Add to compare" onClick={() => toggle('compare', p.id, 'Comparison')}><GitCompare size={15} /></button>
            <button className="icon" aria-label="Create price alert" onClick={() => createAlert(p.id, 'price-drop').then(() => say('Price alert created')).catch(() => say('Backend not reachable'))}><Bell size={15} /></button>
          </div>
        </div>))}
      </div>
    </div>)
}
