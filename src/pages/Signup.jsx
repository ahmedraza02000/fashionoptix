import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup, saveProfile } from '../services/mockApi.js'
import { useApp } from '../App.jsx'

const PRIORITIES = ['Lowest price', 'Best quality', 'Perfect fit', 'Latest trends']
export default function Signup() {
  const nav = useNavigate()
  const { say, refreshAuth } = useApp()
  const [name, setName] = useState(''), [email, setEmail] = useState('')
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState('')
  const [priorities, setPriorities] = useState([])
  const [err, setErr] = useState('')
  const toggle = p => setPriorities(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p])
  const submit = e => {
    e.preventDefault()
    setErr('')
    if (password !== confirm) return setErr("Passwords don't match")
    if (password.length < 6) return setErr('Password must be at least 6 characters')
    signup(name, email, password).then(r => {
      localStorage.setItem('fo-token', r.token)
      return saveProfile({ priorities }).then(() => r)
    }).then(r => {
      refreshAuth()
      say('Account created')
      nav('/dashboard')
    }).catch(e => setErr(e.message || 'Could not create account — is the backend running?'))
  }
  return (
    <div className="wrap authgrid">
      <div><h1 className="h2">FashionOptix</h1><p className="lead">Compare. Analyze. Decide. Create an account to personalize recommendations across brands.</p></div>
      <form className="card pad" onSubmit={submit}>
        <h3>Create Account</h3>
        {err && <p className="pill warn">{err}</p>}
        <label>Full name<input required value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label>Confirm password<input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        <b>What matters most to you?</b>
        {PRIORITIES.map(p => <label key={p} className="row"><input type="checkbox" checked={priorities.includes(p)} onChange={() => toggle(p)} /> {p}</label>)}
        <button className="btn wide" type="submit">Create Account</button>
        <p className="muted">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>)
}
