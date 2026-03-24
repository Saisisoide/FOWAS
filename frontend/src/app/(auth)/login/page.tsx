'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: 360 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>
          Sign in to FOWAS
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>
          Reliability intelligence platform
        </div>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
            Email
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-bg)', padding: '8px 12px', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          marginTop: 4, padding: '8px 16px', borderRadius: 6,
          background: 'var(--text-1)', color: 'var(--bg)',
          border: 'none', fontSize: 13, fontWeight: 500,
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>
        No account?{' '}
        <Link href="/register" style={{ color: 'var(--accent)' }}>Create one</Link>
      </div>
    </div>
  )
}