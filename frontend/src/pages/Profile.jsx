import React, { useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

// This template serves as both "My Profile" and "Employee Profile (Admin View)"
// In a real app, you would fetch user data based on route params (e.g. /profile vs /directory/:id)
export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock data
  const [formData, setFormData] = useState({
    fullName: "Aarav Mehta",
    email: "emp01@empay.io",
    department: "Engineering",
    designation: "Tech Lead",
    basicSalary: "50000",
  });

  // Mock roles for the UI demo (In reality, pulled from Context)
  const isHR = true; 

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader 
        title="Employee Profile" 
        description="View and manage personal and professional details."
        actions={
          <Button 
            variant={isEditing ? "secondary" : "primary"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                AM
              </div>
              <h3 className="text-xl font-bold text-slate-900">{formData.fullName}</h3>
              <p className="text-sm text-slate-500">{formData.designation}</p>
              <div className="mt-4 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">Active</div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Full Name" 
                  value={formData.fullName} 
                  disabled={!isEditing} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
                <Input 
                  label="Email Address" 
                  value={formData.email} 
                  disabled={!isEditing} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <Input 
                  label="Department" 
                  value={formData.department} 
                  disabled={!isEditing || !isHR} // Only HR can edit dept
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
                <Input 
                  label="Designation" 
                  value={formData.designation} 
                  disabled={!isEditing || !isHR} 
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                />
                {isHR && (
                  <Input 
                    label="Basic Salary (Admin Only)" 
                    type="number"
                    value={formData.basicSalary} 
                    disabled={!isEditing} 
                    onChange={(e) => setFormData({...formData, basicSalary: e.target.value})}
                  />
                )}
              </div>
              
              {isEditing && (
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
