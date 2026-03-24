'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.register(form)
      await login(form.email, form.password)
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
          Create your account
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>FOWAS — Reliability Intelligence</div>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(['full_name', 'email', 'password'] as const).map(field => (
          <div key={field}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              {field === 'full_name' ? 'Full name' : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              value={form[field]}
              onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
              required
            />
          </div>
        ))}

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
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
      </div>
    </div>
  )
}