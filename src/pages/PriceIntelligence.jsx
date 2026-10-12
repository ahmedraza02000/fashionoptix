import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getPriceIntelligence, isBackendError } from '../services/mockApi.js'
import { useApp } from '../App.jsx'

export default function PriceIntelligence() {
  const { say } = useApp()
  const [d, setD] = useState(null)
  const [err, setErr] = useState(false)
  useEffect(() => { getPriceIntelligence().then(setD).catch(e => { setErr(true); if (isBackendError(e)) say('Backend not reachable') }) }, [])
  if (err) return <div className="wrap empty"><h2>Something went wrong.</h2><p className="muted">Start the Python backend and reload.</p></div>
  if (!d) return <div className="wrap"><div className="card skeleton" /></div>
  const stats = [['Tracked Products', d.trackedProducts], ['Average Price Drop', d.averagePriceDrop + '%'], ['Best Deal Found', d.bestDealFound + '%'], ['Alerts Triggered', d.alertsTriggered]]
  return (
    <div className="wrap">
      <h1 className="h2">Price Intelligence</h1>
      <p className="muted">A data view of the demo catalog's pricing behavior — computed live from the seeded database.</p>
      <div className="grid4">{stats.map(([l, v]) => <div key={l} className="card pad"><small className="muted">{l}</small><h2 className="statval">{v}</h2></div>)}</div>
      <div className="grid2">
        <div className="card pad"><b>Average Price Trend (6 months)</b>
          <div style={{ height: 240 }}><ResponsiveContainer><LineChart data={d.priceTrend}><XAxis dataKey="month" /><YAxis width={60} tickFormatter={v => v / 1000 + 'k'} /><Tooltip /><Line dataKey="avgPrice" stroke="var(--accent)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </div>
        <div className="card pad"><b>Average Price by Brand</b>
          <div style={{ height: 240 }}><ResponsiveContainer><BarChart data={d.brandAveragePrice}><XAxis dataKey="brand" hide /><YAxis width={60} tickFormatter={v => v / 1000 + 'k'} /><Tooltip /><Bar dataKey="avgPrice" fill="var(--accent)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>)
}
