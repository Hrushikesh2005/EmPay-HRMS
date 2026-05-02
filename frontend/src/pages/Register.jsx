import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import useAuth from '../hooks/useAuth.js'

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr_officer', label: 'HR Officer' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
  { value: 'admin', label: 'Admin' },
]

function validate(values) {
  const errors = {}

  if (!values.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!values.email.trim()) errors.email = 'Email is required.'
  if (!values.password) errors.password = 'Password is required.'
  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'employee' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const canSubmit = useMemo(() => Object.keys(validate(form)).length === 0, [form])

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    setSubmitError('')

    try {
      await auth.register({
        full_name: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(error?.response?.data?.detail || error?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary-600 p-3 rounded-xl mb-4 shadow-sm">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-2">Set up your EmPay HRMS profile.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {submitError ? <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-danger">{submitError}</div> : null}
              <Input label="Full name" value={form.fullName} onChange={handleChange('fullName')} error={errors.fullName} placeholder="Aarav Mehta" />
              <Input label="Email address" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} placeholder="name@company.com" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Password" type="password" value={form.password} onChange={handleChange('password')} error={errors.password} placeholder="Minimum 8 characters" />
                <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} error={errors.confirmPassword} placeholder="Repeat password" />
              </div>
              <div className="space-y-1.5 w-full">
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={form.role}
                  onChange={handleChange('role')}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit && !isLoading}>
                Create account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-700 hover:text-primary-800">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}