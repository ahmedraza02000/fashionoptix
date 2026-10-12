import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App.jsx'
import { BRANDS } from '../data/brands.js'
import { getProfile, saveProfile } from '../services/mockApi.js'

export default function Profile() {
  const { say, user } = useApp()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!user) return
    getProfile().then(p => setProfile({ preferredBrands: [], priorities: [], ...p })).catch(() => setProfile({}))
  }, [user])

  if (!user) return <div className="wrap empty"><h2>Sign in to view your profile.</h2>
    <p className="muted">Your measurements, preferred brands and priorities are stored against your account.</p>
    <Link className="btn" to="/login">Sign In</Link></div>
  if (!profile) return <div className="wrap"><div className="card skeleton" /></div>

  const toggleBrand = b => setProfile(p => ({ ...p, preferredBrands: p.preferredBrands?.includes(b) ? p.preferredBrands.filter(x => x !== b) : [...(p.preferredBrands || []), b] }))
  const save = () => saveProfile(profile).then(() => say('Profile saved')).catch(() => say('Backend not reachable'))

  return (
    <div className="wrap narrow">
      <h1 className="h2">Profile</h1>
      <div className="card pad">
        <div className="row"><div className="avatar big">{user.name[0]?.toUpperCase()}</div><div><b>{user.name}</b><p className="muted">{user.email}</p></div></div>
      </div>
      <div className="card pad"><b>Measurements (cm / kg)</b>
        <div className="grid3 formgrid">
          {[['height', 'Height'], ['weight', 'Weight'], ['chest', 'Chest'], ['waist', 'Waist'], ['hip', 'Hip'], ['shoulder', 'Shoulder']].map(([k, label]) =>
            <label key={k}>{label}<input type="number" value={profile[k] || ''} onChange={e => setProfile(p => ({ ...p, [k]: +e.target.value }))} /></label>)}
        </div>
        <p className="muted">Or fill these in from the <Link to="/size-predictor">Size Predictor</Link>.</p>
      </div>
      <div className="card pad"><b>Preferred Brands</b>
        <div className="pills">{BRANDS.map(b => <button key={b} type="button" className={'pill btnlike' + (profile.preferredBrands?.includes(b) ? ' accent' : '')} onClick={() => toggleBrand(b)}>{b}</button>)}</div>
      </div>
      <button className="btn" onClick={save}>Save Changes</button>
    </div>)
}
