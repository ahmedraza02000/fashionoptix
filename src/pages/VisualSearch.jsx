import { useState, useRef } from 'react'
import { Upload, Camera, Sparkles } from 'lucide-react'
import { findVisualMatches } from '../services/mockApi.js'
import { rs } from '../components/ProductCard.jsx'
import { Link } from 'react-router-dom'
import { useApp } from '../App.jsx'

export default function VisualSearch() {
  const { say } = useApp()
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | analyzing | done | error
  const [results, setResults] = useState([])
  const inputRef = useRef()

  const handleFile = file => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('analyzing')
    findVisualMatches({ filename: file.name }).then(r => { setResults(r.results); setStatus('done') })
      .catch(() => setStatus('error'))
  }
  const onDrop = e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }

  return (
    <div className="wrap narrow">
      <h1 className="h2">Find Fashion From a Photo.</h1>
      <p className="muted">Upload a picture of a style you like — a prototype visual match ranks the closest items in the demo catalog.</p>
      <div className="upload" onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" hidden onChange={e => handleFile(e.target.files?.[0])} />
        {preview ? <img src={preview} alt="Uploaded fashion reference" className="preview" /> : <>
          <Upload size={28} />
          <p>Drop an image here or</p>
          <button className="btn" type="button">Browse Image</button>
          <small className="muted">Supported: JPG / PNG</small>
        </>}
      </div>
      <button className="btn ghost" type="button" onClick={() => say('Camera capture depends on browser support')}><Camera size={15} /> Use Camera</button>

      {status === 'analyzing' && <div className="card pad scan"><div className="scanbar" /><p>Analyzing your image...</p><p className="muted">Extracting visual features. Comparing against the demo catalog.</p></div>}
      {status === 'error' && <div className="empty"><h3>Something went wrong.</h3><p className="muted">Start the Python backend and try again.</p></div>}
      {status === 'done' && <>
        <h2>Similar Products Found <span className="pill">Prototype Analysis</span></h2>
        <div className="grid4 tight">{results.map(r => (
          <Link to={`/product/${r.product.id}`} key={r.product.id} className="card pad matchcard">
            <span className="pill accent">{r.match}% Match</span>
            <b>{r.product.brand}</b><p className="muted">{r.product.name}</p><p><Sparkles size={13} /> {rs(r.product.price)}</p>
          </Link>))}</div>
      </>}
    </div>)
}
