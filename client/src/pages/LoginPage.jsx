import { useState } from 'react'

export default function LoginPage() {
  const [shop, setShop] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    let val = shop.trim().toLowerCase()
    if (!val.endsWith('.myshopify.com')) val += '.myshopify.com'
    // Go directly to Express server for OAuth
    window.location.href = `https://marginpilot.co/auth?shop=${encodeURIComponent(val)}`
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Margin Pilot</h1>
        <p>Connect your Shopify store to get started</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="your-store.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            required
          />
          <button type="submit">Connect with Shopify</button>
        </form>
      </div>
    </div>
  )
}
