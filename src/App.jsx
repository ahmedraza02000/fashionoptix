import { createContext, useContext, useEffect, useState } from 'react'
import { Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom'
import { Moon, Sun, Heart, WifiOff, Bell, Menu, X, User, LogOut, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import SizePredictor from './pages/SizePredictor.jsx'
import VisualSearch from './pages/VisualSearch.jsx'
import OutfitStudio from './pages/OutfitStudio.jsx'
import Compare from './pages/Compare.jsx'
import PriceIntelligence from './pages/PriceIntelligence.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Alerts from './pages/Alerts.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import { getWishlist, toggleWishlist, getAlerts, getMe, logout as apiLogout, isBackendError } from './services/mockApi.js'

const Ctx = createContext()
export const useApp = () => useContext(Ctx)

const NAV_LINKS = [['/search', 'Discover'], ['/compare', 'Compare'], ['/visual-search', 'Visual Search'], ['/outfit-studio', 'Outfit Studio'], ['/price-intelligence', 'Price Intelligence']]
const ACCOUNT_LINKS = [['/dashboard', 'Dashboard', LayoutDashboard], ['/wishlist', 'Wishlist', Heart], ['/alerts', 'Alerts', Bell], ['/profile', 'Profile', User], ['/settings', 'Settings', SettingsIcon]]

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fo-theme') || 'light')
  const [state, setState] = useState({ wishlist: [], compare: [] })
  const [toast, setToast] = useState('')
  const [backendDown, setBackendDown] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [user, setUser] = useState(null)
  const nav = useNavigate()

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('fo-theme', theme) }, [theme])

  // Wishlist and alerts are real: loaded from and saved to the SQLite
  // database via the Python backend. When a token is present they're
  // scoped to that account; otherwise they fall back to a shared guest
  // bucket on the backend, so the demo still works without a login.
  // Compare stays as local session state since it's meant to be temporary.
  const refresh = () => {
    getWishlist().then(r => setState(s => ({ ...s, wishlist: r.ids }))).catch(e => { if (isBackendError(e)) setBackendDown(true) })
    getAlerts().then(a => setAlertCount(a.length)).catch(() => {})
    getMe().then(r => setUser(r.user)).catch(() => {})
  }
  useEffect(refresh, [])

  const say = m => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const toggle = (key, id, label) => {
    if (key === 'wishlist') {
      toggleWishlist(id).then(r => {
        say(r.added ? `Added to ${label.toLowerCase()}` : `Removed from ${label.toLowerCase()}`)
        setState(s => ({ ...s, wishlist: r.added ? [...s.wishlist, id] : s.wishlist.filter(x => x !== id) }))
      }).catch(e => { if (isBackendError(e)) setBackendDown(true); say('Backend not reachable — start the Python server') })
      return
    }
    setState(s => {
      const has = s[key].includes(id)
      say(has ? `Removed from ${label.toLowerCase()}` : `Added to ${label.toLowerCase()}`)
      return { ...s, [key]: has ? s[key].filter(x => x !== id) : [...s[key], id].slice(-4) }
    })
  }
  const logout = () => {
    apiLogout().catch(() => {})
    localStorage.removeItem('fo-token')
    setUser(null)
    setMenu(false)
    say('Signed out')
    refresh()
    nav('/')
  }

  return (
    <Ctx.Provider value={{ ...state, toggle, say, theme, setTheme, user, refreshAuth: refresh }}>
      <header className="nav"><div className="wrap navin">
        <div className="row">
          <button className="icon mobile-only" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu size={18} /></button>
          <Link to="/" className="logo">Fashion<b>Optix</b></Link>
        </div>
        <nav aria-label="Main" className="desktop-only">{NAV_LINKS.map(([to, t]) => <NavLink key={to} to={to}>{t}</NavLink>)}</nav>
        <div className="row">
          <Link to="/wishlist" className="chip desktop-only" aria-label="Wishlist"><Heart size={14} /> {state.wishlist.length}</Link>
          <Link to="/alerts" className="chip desktop-only" aria-label="Notifications"><Bell size={14} /> {alertCount}</Link>
          <button className="icon" aria-label="Toggle theme" onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); say('Theme updated') }}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          <div className="dropdown-wrap">
            <button className="avatar" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>{user ? user.name[0]?.toUpperCase() : <User size={15} />}</button>
            {menu && <div className="dropdown" role="menu" onMouseLeave={() => setMenu(false)}>
              {user ? <>
                <p className="muted dd-user">{user.name}</p>
                {ACCOUNT_LINKS.map(([to, t, I]) => <Link key={to} to={to} onClick={() => setMenu(false)}><I size={14} /> {t}</Link>)}
                <button onClick={logout}><LogOut size={14} /> Sign Out</button>
              </> : <>
                <Link to="/login" onClick={() => setMenu(false)}>Sign In</Link>
                <Link to="/signup" onClick={() => setMenu(false)}>Create Account</Link>
              </>}
            </div>}
          </div>
          <Link to="/search" className="btn desktop-only">Start Exploring</Link>
        </div>
      </div></header>

      {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)}>
        <nav className="drawer" onClick={e => e.stopPropagation()} aria-label="Mobile menu">
          <button className="icon" aria-label="Close menu" onClick={() => setDrawer(false)}><X size={18} /></button>
          {NAV_LINKS.map(([to, t]) => <Link key={to} to={to} onClick={() => setDrawer(false)}>{t}</Link>)}
          <hr />
          {ACCOUNT_LINKS.map(([to, t]) => <Link key={to} to={to} onClick={() => setDrawer(false)}>{t}</Link>)}
          {!user && <><Link to="/login" onClick={() => setDrawer(false)}>Sign In</Link><Link to="/signup" onClick={() => setDrawer(false)}>Create Account</Link></>}
        </nav>
      </div>}

      {backendDown && <div className="banner"><WifiOff size={15} /> Backend not reachable at localhost:8000 — run <code>python app.py</code> in the backend folder. Showing what still works without it.</div>}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/size-predictor" element={<SizePredictor />} />
          <Route path="/visual-search" element={<VisualSearch />} />
          <Route path="/outfit-studio" element={<OutfitStudio />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/price-intelligence" element={<PriceIntelligence />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<div className="wrap empty"><h2>Page not found.</h2><Link className="btn" to="/">Go Home</Link></div>} />
        </Routes>
      </main>
      <footer className="wrap foot">© 2026 FashionOptix — Final Year Project · Prototype with demo data. Purchases happen on official brand websites.</footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </Ctx.Provider>
  )
}
