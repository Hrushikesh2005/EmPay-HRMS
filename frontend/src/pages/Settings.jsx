import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Search,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight,
  Lock,
  Shield,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { DataTable } from "../components/ui/DataTable";
import api from "../api/axios.js";
import useAuth from "../hooks/useAuth.js";

function formatRole(role) {
  return typeof role === "string" ? role.replace(/_/g, " ") : "";
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
        active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function Settings() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  
  // User Management State (Admin only)
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    async function loadUsers() {
      try {
        setLoading(true);
        setUsersError("");
        const response = await api.get("/users");
        if (isMounted) {
          setUsers(response.data || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setUsersError(
            requestError?.response?.data?.detail || "Failed to load users.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const handleToggleStatus = async (user) => {
    try {
      setSavingId(user.id);
      const response = await api.patch(`/users/${user.id}/status`, {
        is_active: !user.is_active,
      });

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id ? response.data : item,
        ),
      );
    } catch (requestError) {
      alert(
        requestError?.response?.data?.detail || "Unable to update user status.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      setSavingId(user.id);
      const response = await api.patch(`/users/${user.id}/role`, {
        role: newRole,
      });

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id ? response.data : item,
        ),
      );
    } catch (requestError) {
      alert(
        requestError?.response?.data?.detail || "Unable to update user role.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { header: "Name", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: "role",
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row, e.target.value)}
          disabled={savingId === row.id}
          className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="employee">Employee</option>
          <option value="hr_officer">HR Officer</option>
          <option value="payroll_officer">Payroll Officer</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (row) => <StatusPill active={row.is_active} />,
    },
    {
      header: "Action",
      accessor: "id",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          variant={row.is_active ? "secondary" : "primary"}
          onClick={() => handleToggleStatus(row)}
          disabled={savingId === row.id}
        >
          {row.is_active ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage user access and system preferences."
      />

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">User Access Management</h3>
            <p className="text-sm text-slate-600">
              Control which employees have access to the HRMS portal. 
              Deactivating a user blocks their login immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-400" />
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading users...</div>
          ) : (
            <DataTable columns={columns} data={filteredUsers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
