import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Search,
  Settings as SettingsIcon,
  Shield,
  Users as UsersIcon,
  Lock,
  ChevronRight,
  Save,
  Loader2,
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

  const [activeTab, setActiveTab] = useState("users");

  // User Management State
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);

  // Permissions State
  const [permissions, setPermissions] = useState([]);
  const [stagedPermissions, setStagedPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return JSON.stringify(permissions) !== JSON.stringify(stagedPermissions);
  }, [permissions, stagedPermissions]);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    loadPermissions();
  }, [isAdmin]);

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const response = await api.get("/users");
      setUsers(response.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadPermissions() {
    try {
      setLoadingPermissions(true);
      const response = await api.get("/permissions");
      setPermissions(response.data || []);
      setStagedPermissions(response.data || []);
    } catch (err) {
      console.error("Failed to load permissions", err);
    } finally {
      setLoadingPermissions(false);
    }
  }

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) return;
    try {
      setSavingUserId(user.id);
      const response = await api.patch(`/users/${user.id}/status`, {
        is_active: !user.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? response.data : u)));
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (!window.confirm(`Change role for ${user.full_name} to ${newRole}?`)) return;
    try {
      setSavingUserId(user.id);
      const response = await api.patch(`/users/${user.id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? response.data : u)));
    } catch (err) {
      alert("Failed to update role");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleStagePermission = (permId, field, value) => {
    setStagedPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveChanges = async () => {
    const changedItems = stagedPermissions.filter((staged) => {
      const original = permissions.find((p) => p.id === staged.id);
      return JSON.stringify(staged) !== JSON.stringify(original);
    });

    if (changedItems.length === 0) return;

    if (!window.confirm(`Are you sure you want to apply ${changedItems.length} security changes?`)) return;

    try {
      setIsSaving(true);
      await api.post("/permissions/bulk-update", { items: changedItems });
      setPermissions([...stagedPermissions]);
      alert("Permissions updated successfully!");
    } catch (err) {
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userColumns = [
    { header: "Name", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: "role",
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row, e.target.value)}
          className="text-xs border rounded px-1 py-1"
          disabled={savingUserId === row.id}
        >
          <option value="employee">Employee</option>
          <option value="hr_officer">HR Officer</option>
          <option value="payroll_officer">Payroll Officer</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    { header: "Status", accessor: "is_active", render: (row) => <StatusPill active={row.is_active} /> },
    {
      header: "Action",
      render: (row) => (
        <Button
          size="sm"
          variant={row.is_active ? "secondary" : "primary"}
          onClick={() => handleToggleStatus(row)}
          disabled={savingUserId === row.id}
        >
          {row.is_active ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  const rolesList = ["admin", "hr_officer", "payroll_officer", "employee"];
  const modulesList = ["dashboard", "directory", "attendance", "leave", "payroll", "reports", "settings"];

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Settings" description="Manage company access and security configurations." />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "users" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" /> User Management
          </div>
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "permissions" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> Role Permissions
          </div>
        </button>
      </div>

      {activeTab === "users" ? (
        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">Assign roles to users to control which modules they can see.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={userColumns} data={filteredUsers} loading={loadingUsers} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="p-4 flex items-center gap-3 text-amber-800 text-sm">
              <Shield className="w-5 h-5" />
              Changes here affect all users with the selected role immediately after saving.
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            {rolesList.map((roleName) => (
              <Card key={roleName}>
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                  <CardTitle className="text-sm font-bold capitalize flex items-center gap-2">
                    {roleName.replace("_", " ")} Role
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-50/50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Module</th>
                        <th className="px-4 py-3">Access Level</th>
                        <th className="px-4 py-3 text-center">Edit Rights</th>
                        <th className="px-4 py-3 text-center">Delete Rights</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {modulesList.map((moduleName) => {
                        const perm = stagedPermissions.find((p) => p.role === roleName && p.module === moduleName);
                        if (!perm) return null;

                        const originalPerm = permissions.find((p) => p.id === perm.id);
                        const isChanged = JSON.stringify(perm) !== JSON.stringify(originalPerm);

                        return (
                          <tr key={moduleName} className={`transition-colors ${isChanged ? "bg-primary-50/50" : "hover:bg-slate-50"}`}>
                            <td className="px-4 py-3 font-medium capitalize">
                              <div className="flex items-center gap-2">
                                {moduleName}
                                {isChanged && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={perm.access_level}
                                onChange={(e) => handleStagePermission(perm.id, "access_level", e.target.value)}
                                disabled={roleName === "admin"}
                                className={`border rounded px-2 py-1 text-xs bg-white ${isChanged ? "border-primary-300" : ""}`}
                              >
                                <option value="none">None</option>
                                <option value="self">Self Only</option>
                                <option value="all">Full Company</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={perm.can_edit}
                                onChange={(e) => handleStagePermission(perm.id, "can_edit", e.target.checked)}
                                disabled={roleName === "admin"}
                                className="w-4 h-4 rounded text-primary-600"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={perm.can_delete}
                                onChange={(e) => handleStagePermission(perm.id, "can_delete", e.target.checked)}
                                disabled={roleName === "admin"}
                                className="w-4 h-4 rounded text-primary-600"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Floating Save Button */}
          {hasChanges && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
              <Card className="bg-slate-900 text-white shadow-2xl border-slate-800 py-3 px-6 flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium">Unsaved Changes</span>
                  <span className="text-sm font-semibold">You have modified role permissions</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={loadPermissions} className="text-slate-300 hover:text-white hover:bg-slate-800">
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSaveChanges} isLoading={isSaving} className="bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-900/20">
                    <Save className="w-4 h-4 mr-2" /> Save All Changes
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
