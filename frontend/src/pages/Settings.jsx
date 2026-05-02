import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Search,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
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
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    async function loadUsers() {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/users");
        if (isMounted) {
          setUsers(response.data || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
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

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Access Denied"
          description="Settings section is available only to administrators."
        />
        <Card>
          <CardContent className="p-8">
            <p className="text-slate-600">
              Only admins can access the Settings section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
          {formatRole(row.role)}
        </span>
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
          {row.is_active ? (
            <>
              <ToggleLeft className="w-4 h-4 mr-2" /> Deactivate
            </>
          ) : (
            <>
              <ToggleRight className="w-4 h-4 mr-2" /> Activate
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Status Management"
        description="Activate or deactivate users. Inactive users cannot log in to the portal."
      />

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Admin Control</h3>
            <p className="text-sm text-slate-600">
              Switching a user to inactive immediately blocks future logins and
              authenticated requests for that account.
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
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Users ({filteredUsers.length})
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
