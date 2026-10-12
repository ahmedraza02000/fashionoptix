import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/mockApi.js'
import { useApp } from '../App.jsx'

export default function Login() {
  const nav = useNavigate()
  const { say, refreshAuth } = useApp()
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const submit = e => {
    e.preventDefault()
    setErr('')
    login(email, password).then(r => {
      localStorage.setItem('fo-token', r.token)
      refreshAuth()
      say(`Welcome back, ${r.user.name}`)
      nav('/dashboard')
    }).catch(e => setErr(e.message || 'Could not sign in — is the backend running?'))
  }
  return (
    <div className="wrap authgrid">
      <div><h1 className="h2">FashionOptix</h1><p className="lead">One search. Every brand. Smarter decisions. Sign in to see your saved items, alerts and preferences.</p></div>
      <form className="card pad" onSubmit={submit}>
        <h3>Sign In</h3>
        {err && <p className="pill warn">{err}</p>}
        <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label className="row"><input type="checkbox" /> Remember me</label>
        <button className="btn wide" type="submit">Sign In</button>
        <button type="button" className="link" onClick={() => say('Password reset is not wired up in this prototype')}>Forgot password?</button>
        <div className="row"><button type="button" className="btn ghost" onClick={() => say('Demo only — social login is not connected')}>Continue with Google</button></div>
        <p className="muted">Don't have an account? <Link to="/signup">Create one</Link></p>
      </form>
    </div>)
}
