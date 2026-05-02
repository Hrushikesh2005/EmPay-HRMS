import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">Your account does not have permission to view this page.</p>
          <Link to="/dashboard">
            <Button className="w-full">Go to dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}