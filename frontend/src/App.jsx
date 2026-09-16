import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Test frontend-backend communication
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧠 NeuroChat</h1>
        <p className="tagline">Your Intelligent Conversation Partner</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>System Status</h2>
          {loading && <p className="status-loading">Connecting to backend...</p>}
          {error && (
            <div className="status-error">
              <p>❌ Backend connection failed</p>
              <p className="error-detail">{error}</p>
              <p className="error-hint">Make sure the backend server is running on port 5000</p>
            </div>
          )}
          {healthStatus && (
            <div className="status-success">
              <p>✅ Status: {healthStatus.status}</p>
              <p>📡 {healthStatus.message}</p>
              <p>🕐 {new Date(healthStatus.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>NeuroChat &copy; 2026 — BCA 5th Semester Field Project</p>
      </footer>
    </div>
  )
}

export default App
