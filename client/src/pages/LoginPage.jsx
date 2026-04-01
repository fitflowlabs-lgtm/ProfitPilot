import { useState } from 'react'
import { api } from '../api'

export default function LoginPage({ onSwitch, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const user = await api.login({ email, password })
    onLogin(user)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Margin Pilot</h1>
        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Log In</button>
        <button className="btn-ghost" onClick={onSwitch}>
          Create an account
        </button>
      </div>
    </div>
  )
}