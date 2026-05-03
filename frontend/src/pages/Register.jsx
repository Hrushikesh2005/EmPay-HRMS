import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Building2, Phone, Briefcase, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import api from '../api/axios.js'

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr_officer', label: 'HR Officer' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
  { value: 'admin', label: 'Admin' },
]

const EMPLOYMENT_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
]

function validate(values) {
  const errors = {}
  if (!values.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!values.email.trim()) errors.email = 'Email is required.'
  if (!values.dateOfJoining) errors.dateOfJoining = 'Joining date is required.'
  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'employee',
    department: '',
    designation: '',
    phone: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    employmentType: 'full_time'
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successData, setSuccessData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments')
        setDepartments(res.data)
      } catch (err) {
        console.error('Failed to load departments', err)
      }
    }
    fetchDepartments()
  }, [])

  const canSubmit = useMemo(() => Object.keys(validate(form)).length === 0, [form])

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    setSubmitError('')
    setSuccessData(null)

    try {
      const response = await api.post('/users/onboard', {
        full_name: form.fullName,
        email: form.email,
        role: form.role,
        department_id: form.department || null,
        designation: form.designation || null,
        phone: form.phone || null,
        date_of_joining: form.dateOfJoining,
        employment_type: form.employmentType
      })
      
      setSuccessData(response.data)
      // We don't navigate away immediately so admin can see the generated code/status
    } catch (error) {
      setSubmitError(error?.response?.data?.detail || 'Onboarding failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (successData) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="border-green-100 bg-green-50/30">
          <CardContent className="pt-8 text-center">
            <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Employee Onboarded!</h2>
            <p className="text-slate-600 mb-6">
              Registration successful for <span className="font-semibold">{successData.full_name}</span>.
            </p>

            <div className="bg-white border border-green-100 rounded-xl p-6 text-left shadow-sm max-w-sm mx-auto mb-8">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-sm text-slate-500">Employee Code</span>
                  <span className="text-sm font-mono font-bold text-primary-700">{successData.employee_code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-sm text-slate-500">Email</span>
                  <span className="text-sm font-medium text-slate-900">{successData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Welcome Email</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    successData.email_status === 'sent' ? 'bg-green-100 text-green-700' : 
                    successData.email_status === 'failed' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {successData.email_status === 'sent' ? 'Sent Successfully' : 
                     successData.email_status === 'failed' ? 'Failed to Send' : 
                     'Email Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setSuccessData(null)}>Onboard Another</Button>
              <Button onClick={() => navigate('/directory')}>View Directory</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-primary-600" />
          Onboard New Employee
        </h1>
        <p className="text-slate-500 mt-1">Fill in the details to create a new employee profile and auto-generate credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-danger text-sm font-medium">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Information */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Primary Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Input 
                label="Full Name" 
                value={form.fullName} 
                onChange={handleChange('fullName')} 
                error={errors.fullName} 
                placeholder="e.g. Aarav Mehta" 
              />
              <Input 
                label="Email Address" 
                type="email" 
                value={form.email} 
                onChange={handleChange('email')} 
                error={errors.email} 
                placeholder="e.g. aarav@company.com" 
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">System Role</label>
                <select
                  value={form.role}
                  onChange={handleChange('role')}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <select
                    value={form.department}
                    onChange={handleChange('department')}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input 
                  label="Designation" 
                  value={form.designation} 
                  onChange={handleChange('designation')} 
                  placeholder="e.g. Frontend Lead" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Employment Type</label>
                <select
                  value={form.employmentType}
                  onChange={handleChange('employmentType')}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {EMPLOYMENT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <Input 
                label="Joining Date" 
                type="date" 
                value={form.dateOfJoining} 
                onChange={handleChange('dateOfJoining')} 
                error={errors.dateOfJoining} 
              />
              <Input 
                label="Phone Number" 
                value={form.phone} 
                onChange={handleChange('phone')} 
                placeholder="+91 XXXXX XXXXX" 
                icon={<Phone className="w-4 h-4" />}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 max-w-xs italic text-right">
            Note: Temporary password and Employee ID will be sent to the employee's email address automatically.
          </p>
          <Button 
            type="submit" 
            className="px-8 shadow-lg shadow-primary-600/20" 
            isLoading={isLoading} 
            disabled={!canSubmit || isLoading}
          >
            Complete Onboarding
          </Button>
        </div>
      </form>
    </div>
  )
}
