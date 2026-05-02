import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Building2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      return setError("Please fill in all fields.");
    }
    setIsLoading(true);
    
    // UI behavior mock (FE Architect will wire real API via Axios later)
    setTimeout(() => {
      setIsLoading(false);
      setError("Backend integration pending. Use placeholder credentials.");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary-600 p-3 rounded-xl mb-4 shadow-sm">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">EmPay HRMS</h2>
          <p className="text-slate-500 mt-2">Sign in to your employee portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-danger text-sm rounded-md border border-red-100">
                  {error}
                </div>
              )}
              
              <Input 
                label="Email address" 
                type="email" 
                placeholder="name@empay.io" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Sign in
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-slate-500">
              <p>Demo Credentials:</p>
              <p className="mt-1">admin@empay.io | hr@empay.io | emp01@empay.io</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
