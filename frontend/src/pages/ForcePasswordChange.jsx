import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import api from '../api/axios.js'
import useAuth from '../hooks/useAuth.js'

export default function ForcePasswordChange() {
  const navigate = useNavigate()
  const { setSession, user, logout } = useAuth()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/change-password', {
        old_password: form.oldPassword,
        new_password: form.newPassword
      })
      
      // Update local session to reflect that password is changed
      setSession(prev => ({
        ...prev,
        mustChangePassword: false,
        user: { ...prev.user, must_change_password: false }
      }))

      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to change password. Please check your current password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Security Update</h1>
          <p className="text-slate-500 mt-2">You are required to change your password before continuing to your dashboard.</p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-600" />
              Set New Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-danger text-sm font-medium">
                  {error}
                </div>
              )}
              
              <Input
                label="Current Password"
                type="password"
                placeholder="Password from email"
                value={form.oldPassword}
                onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                required
              />
              
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg shadow-lg" isLoading={isLoading}>
                Update & Continue
              </Button>
            </form>

            <button 
              onClick={logout}
              className="w-full mt-6 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel and sign out
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
