import React, { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useRolePermissions, SYSTEM_MODULES, SYSTEM_ROLES, ROLE_TEMPLATES } from "@/hooks/useRolePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield, Copy, FileText, Sparkles, Check, X,
} from "lucide-react";

const PERMISSION_FIELDS = [
  { key: "can_view", label: "View" },
  { key: "can_create", label: "Create" },
  { key: "can_edit", label: "Edit" },
  { key: "can_delete", label: "Delete" },
  { key: "can_approve", label: "Approve" },
  { key: "can_export", label: "Export" },
] as const;

const RoleManagementPage = () => {
  usePageTitle("Role Management", "Manage roles and module-level permissions");
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { allPermissions, loading, upsertPermission, applyTemplate, cloneRole, refetch } = useRolePermissions();
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneTarget, setCloneTarget] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const canManage = isSuperAdmin || isBusinessAdmin;

  const getPermission = (roleKey: string, moduleKey: string, field: string): boolean => {
    const perm = allPermissions.find(
      (p) => p.role_name === roleKey && p.module_key === moduleKey
    );
    return perm ? (perm as any)[field] === true : false;
  };

  const handleToggle = async (moduleKey: string, field: string, currentValue: boolean) => {
    if (!canManage) return;
    await upsertPermission(selectedRole, moduleKey, { [field]: !currentValue });
    toast.success(`Permission updated`);
  };

  const handleApplyTemplate = async (templateKey: string) => {
    await applyTemplate(selectedRole, templateKey);
    toast.success(`Template "${templateKey}" applied to ${selectedRole}`);
    setTemplateDialogOpen(false);
  };

  const handleClone = async () => {
    if (!cloneTarget.trim()) return;
    await cloneRole(selectedRole, cloneTarget.trim().toLowerCase().replace(/\s+/g, "_"));
    toast.success(`Cloned "${selectedRole}" → "${cloneTarget}"`);
    setCloneDialogOpen(false);
    setCloneTarget("");
  };

  if (!canManage) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-3 text-destructive/50" />
        <p className="font-semibold">Access Restricted</p>
        <p className="text-sm">Only Super Admins and Business Admins can manage roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg gradient-primary p-5">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary-foreground/80" />
            <span className="text-xs text-primary-foreground/80 font-medium">Security</span>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">Role & Permission Management</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Configure module-level access for each role with granular permission control
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {SYSTEM_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                <span className="capitalize">{r.replace(/_/g, " ")}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setTemplateDialogOpen(true)}>
          <FileText className="h-4 w-4 mr-1.5" /> Apply Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCloneDialogOpen(true)}>
          <Copy className="h-4 w-4 mr-1.5" /> Clone Role
        </Button>

        <Badge variant="secondary" className="ml-auto text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          {selectedRole.replace(/_/g, " ").toUpperCase()}
        </Badge>
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Permission Matrix — <span className="capitalize text-primary">{selectedRole.replace(/_/g, " ")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground min-w-[180px]">Module</th>
                    {PERMISSION_FIELDS.map((f) => (
                      <th key={f.key} className="text-center p-3 font-medium text-muted-foreground w-20">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SYSTEM_MODULES.map((mod) => (
                    <tr key={mod.key} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{mod.label}</td>
                      {PERMISSION_FIELDS.map((f) => {
                        const checked = getPermission(selectedRole, mod.key, f.key);
                        return (
                          <td key={f.key} className="text-center p-3">
                            {selectedRole === "super_admin" || selectedRole === "business_admin" ? (
                              <Check className="h-4 w-4 text-success mx-auto" />
                            ) : (
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => handleToggle(mod.key, f.key, checked)}
                                className="mx-auto"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Data Access Levels</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>Employee</strong> → Own Data</li>
              <li>• <strong>Manager</strong> → Department Data</li>
              <li>• <strong>Admin</strong> → Company Data</li>
              <li>• <strong>Super Admin</strong> → Global Data</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-success uppercase tracking-wide mb-1">Bypass Roles</p>
            <p className="text-xs text-muted-foreground">
              Super Admin and Business Admin roles automatically bypass all module permission checks and have full access.
            </p>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-warning uppercase tracking-wide mb-1">Audit Trail</p>
            <p className="text-xs text-muted-foreground">
              All permission changes are logged to the audit system. View the full history in Admin → Audit Logs.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Permission Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Choose a template to apply to <strong className="capitalize">{selectedRole.replace(/_/g, " ")}</strong>.
              This will overwrite existing permissions for this role.
            </p>
            <div className="grid gap-2 mt-4">
              {Object.keys(ROLE_TEMPLATES).map((tpl) => (
                <Button
                  key={tpl}
                  variant="outline"
                  className="justify-start capitalize"
                  onClick={() => handleApplyTemplate(tpl)}
                >
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  {tpl.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Role Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Clone all permissions from <strong className="capitalize">{selectedRole.replace(/_/g, " ")}</strong> to a new role name.
            </p>
            <Input
              placeholder="e.g. senior_seo_manager"
              value={cloneTarget}
              onChange={(e) => setCloneTarget(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleClone} disabled={!cloneTarget.trim()}>Clone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagementPage;
