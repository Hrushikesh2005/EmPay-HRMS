import { PageHeader } from "../components/ui/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import useAuth from "../hooks/useAuth.js";

// This template serves as both "My Profile" and "Employee Profile (Admin View)"
// In a real app, you would fetch user data based on route params (e.g. /profile vs /directory/:id)
export default function Profile() {
  const { user } = useAuth();

  const fullName = user?.full_name || "";
  const email = user?.email || "";
  const role = user?.role || "";

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Employee Profile"
        description="View and manage personal and professional details."
        actions={null}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                {fullName
                  ? fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((chunk) => chunk[0])
                      .join("")
                      .toUpperCase()
                  : ""}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {fullName || "Profile"}
              </h3>
              <p className="text-sm text-slate-500">{role.replace("_", " ")}</p>
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
                <Input label="Full Name" value={fullName} disabled />
                <Input label="Email Address" value={email} disabled />
                <Input
                  label="Department"
                  value=""
                  placeholder="Not available"
                  disabled
                />
                <Input
                  label="Designation"
                  value=""
                  placeholder="Not available"
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
