import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import useAuth from "../hooks/useAuth.js";

function validate(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = "Email is required.";
  if (!values.password) errors.password = "Password is required.";
  return errors;
}

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(
    () => Object.keys(validate(form)).length === 0,
    [form],
  );

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setSubmitError("");

    try {
      await auth.login(form);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Login failed. Check your credentials and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary-600 p-3 rounded-xl mb-4 shadow-sm">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            EmPay HRMS
          </h2>
          <p className="text-slate-500 mt-2">Sign in to continue.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError ? (
                <div className="p-3 bg-red-50 text-danger text-sm rounded-md border border-red-100">
                  {submitError}
                </div>
              ) : null}

              <Input
                label="Email address"
                type="email"
                placeholder="name@empay.io"
                value={form.email}
                onChange={handleChange("email")}
                error={errors.email}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange("password")}
                error={errors.password}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={!canSubmit && !isLoading}
              >
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
