import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, TrendingDown } from 'lucide-react'
import { getProducts, getAlerts, getPriceIntelligence } from '../services/mockApi.js'
import ProductCard from '../components/ProductCard.jsx'
import { useApp } from '../App.jsx'

export default function Dashboard() {
  const { wishlist, compare, user } = useApp()
  const [products, setProducts] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [intel, setIntel] = useState(null)
  const recent = JSON.parse(localStorage.getItem('fo-recent-searches') || '[]')

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]))
    getAlerts().then(setAlerts).catch(() => setAlerts([]))
    getPriceIntelligence().then(setIntel).catch(() => setIntel(null))
  }, [])

  if (!products) return <div className="wrap"><div className="card skeleton" /></div>
  const wishlistProducts = products.filter(p => wishlist.includes(p.id))
  const avgSavings = wishlistProducts.length ? Math.round(wishlistProducts.reduce((s, p) => s + p.discount, 0) / wishlistProducts.length) : 0
  const priceDrops = [...products].sort((a, b) => b.discount - a.discount).slice(0, 4)
  const recommended = products.filter(p => p.qualityScore > 85 && !wishlist.includes(p.id)).slice(0, 4)
  const trendDelta = intel && intel.priceTrend.length > 1
    ? Math.round((1 - intel.priceTrend.at(-1).avgPrice / intel.priceTrend.at(-2).avgPrice) * 100) : null

  return (
    <div className="wrap">
      <h1 className="h2">Good day, {user?.name || 'Guest'} 👋</h1>
      <p className="muted">Here is your shopping intelligence.</p>
      <div className="grid4">
        {[['Saved Items', wishlist.length], ['Price Alerts', alerts.length], ['Average Savings', avgSavings + '%'], ['Products Compared', compare.length]]
          .map(([l, v]) => <div key={l} className="card pad"><small className="muted">{l}</small><h2 className="statval">{v}</h2></div>)}
      </div>

      <h2>Price Drops</h2><div className="grid4">{priceDrops.map(p => <ProductCard key={p.id} product={p} />)}</div>

      <h2>Your Watchlist</h2>
      {wishlistProducts.length ? <div className="grid4">{wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}</div>
        : <div className="card pad"><p className="muted">Your wishlist is empty. <Link to="/search">Explore Products</Link></p></div>}

      <h2>Recommended For You</h2><div className="grid4">{recommended.map(p => <ProductCard key={p.id} product={p} />)}</div>

      <div className="grid2">
        <div className="card pad"><b>Recent Searches</b>
          {recent.length ? <ul className="plainlist">{recent.slice(0, 6).map((q, i) => <li key={i}><Link to={`/search?q=${encodeURIComponent(q)}`}>{q}</Link></li>)}</ul> : <p className="muted">No recent searches yet.</p>}
        </div>
        <div className="card pad"><b><Sparkles size={14} /> Market Insight <span className="pill">Prototype Analysis</span></b>
          <p className="insight"><TrendingDown size={14} /> {trendDelta !== null ? `Tracked products are currently ${Math.abs(trendDelta)}% ${trendDelta > 0 ? 'cheaper' : 'pricier'} than last month's average.` : 'Not enough history yet to compute a trend.'}</p>
        </div>
      </div>
    </div>)
}
