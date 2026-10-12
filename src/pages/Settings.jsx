import { useEffect, useState } from 'react'
import { useApp } from '../App.jsx'
import { getProfile, saveProfile } from '../services/mockApi.js'

export default function Settings() {
  const { theme, setTheme, say, user } = useApp()
  const [notif, setNotif] = useState(() => JSON.parse(localStorage.getItem('fo-notifications') || JSON.stringify({
    priceDropAlerts: true, restockAlerts: true, recommendations: true, dataSharing: false,
  })))
  const [budget, setBudget] = useState(10000)

  useEffect(() => { if (user) getProfile().then(p => setBudget(p.budget || 10000)).catch(() => {}) }, [user])

  const setN = (k, v) => setNotif(s => ({ ...s, [k]: v }))
  const save = () => {
    localStorage.setItem('fo-notifications', JSON.stringify(notif))
    if (user) saveProfile({ budget }).then(() => say('Settings updated')).catch(() => say('Backend not reachable'))
    else say('Settings updated locally — sign in to sync your budget to your account')
  }
  return (
    <div className="wrap narrow">
      <h1 className="h2">Settings</h1>
      {!user && <p className="pill warn">Not signed in — notification choices stay on this browser only. <a href="/login">Sign in</a> to sync shopping preferences to your account.</p>}
      <div className="card pad"><b>Notifications</b>
        <label className="row"><input type="checkbox" checked={notif.priceDropAlerts} onChange={e => setN('priceDropAlerts', e.target.checked)} /> Price drop alerts</label>
        <label className="row"><input type="checkbox" checked={notif.restockAlerts} onChange={e => setN('restockAlerts', e.target.checked)} /> Restock alerts</label>
        <label className="row"><input type="checkbox" checked={notif.recommendations} onChange={e => setN('recommendations', e.target.checked)} /> Personalized recommendations</label>
      </div>
      <div className="card pad"><b>Privacy</b>
        <label className="row"><input type="checkbox" checked={notif.dataSharing} onChange={e => setN('dataSharing', e.target.checked)} /> Allow anonymized data use to improve recommendations</label>
      </div>
      <div className="card pad"><b>Appearance</b>
        <label className="row"><input type="radio" name="theme" checked={theme === 'light'} onChange={() => setTheme('light')} /> Light</label>
        <label className="row"><input type="radio" name="theme" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Dark</label>
      </div>
      <div className="card pad"><b>Shopping Preferences</b>
        <label>Monthly budget (Rs.)<input type="number" value={budget} onChange={e => setBudget(+e.target.value)} /></label>
      </div>
      <button className="btn" onClick={save}>Save Settings</button>
    </div>)
}
