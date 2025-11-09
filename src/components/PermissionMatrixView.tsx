import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { 
  Shield, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";

interface PermissionMatrixViewProps {
  className?: string;
}

interface Permission {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  category: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  userCount: number;
  permissions: Permission[];
  permissionIds: number[];
}

interface ViewProps {
  categories: string[];
  groupedPermissions: Record<string, Permission[]>;
  systemRoles: Role[];
  customRoles: Role[];
  expandedCategories: Set<string>;
  toggleCategory: (category: string) => void;
  hasPermission: (role: Role, permissionId: number) => boolean;
}

export function PermissionMatrixView({ className = "" }: PermissionMatrixViewProps) {
  const trpc = useTRPC();
  const { token } = useAuthStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Fetch permissions and roles
  const permissionsQuery = useQuery(
    trpc.getPermissions.queryOptions({ token: token || "" })
  );

  const rolesQuery = useQuery(
    trpc.getRoles.queryOptions({ token: token || "" })
  );

  const permissions = permissionsQuery.data?.permissions || [];
  const groupedPermissions = permissionsQuery.data?.groupedPermissions || {};
  const roles = rolesQuery.data || [];

  // Separate system and custom roles
  const systemRoles = roles.filter((role: Role) => role.isSystemRole);
  const customRoles = roles.filter((role: Role) => !role.isSystemRole);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAllCategories = () => {
    if (expandedCategories.size === Object.keys(groupedPermissions).length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(Object.keys(groupedPermissions)));
    }
  };

  const hasPermission = (role: Role, permissionId: number): boolean => {
    return role.permissionIds.includes(permissionId);
  };

  if (permissionsQuery.isLoading || rolesQuery.isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-cinematic-gold-400" />
      </div>
    );
  }

  if (permissionsQuery.error || rolesQuery.error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/50 rounded-xl p-6 ${className}`}>
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-1">Error Loading Data</h3>
            <p className="text-sm text-red-300">Failed to load permissions or roles data.</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(groupedPermissions);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Permission Matrix</h2>
          <p className="text-sm text-gray-400">
            View all roles and their associated permissions across the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAllCategories}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            {expandedCategories.size === categories.length ? "Collapse All" : "Expand All"}
          </button>
          <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-cinematic-gold-500 text-gray-950"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-cinematic-gold-500 text-gray-950"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Understanding the Permission Matrix</p>
            <p className="text-blue-300/80">
              This matrix shows which permissions are assigned to each role. System roles are built-in and cannot be modified, 
              while custom roles are created by your company. A checkmark (✓) indicates the role has that permission.
            </p>
          </div>
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white mb-1">{systemRoles.length}</div>
          <div className="text-sm text-purple-300">System Roles</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white mb-1">{customRoles.length}</div>
          <div className="text-sm text-indigo-300">Custom Roles</div>
        </div>
        <div className="bg-gradient-to-br from-cinematic-blue-500/10 to-cinematic-blue-500/5 border border-cinematic-blue-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white mb-1">{permissions.length}</div>
          <div className="text-sm text-cinematic-blue-300">Total Permissions</div>
        </div>
        <div className="bg-gradient-to-br from-cinematic-gold-500/10 to-cinematic-gold-500/5 border border-cinematic-gold-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-white mb-1">{categories.length}</div>
          <div className="text-sm text-cinematic-gold-300">Permission Categories</div>
        </div>
      </div>

      {/* Matrix view */}
      {viewMode === "table" ? (
        <TableView
          categories={categories}
          groupedPermissions={groupedPermissions}
          systemRoles={systemRoles}
          customRoles={customRoles}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          hasPermission={hasPermission}
        />
      ) : (
        <CardsView
          categories={categories}
          groupedPermissions={groupedPermissions}
          systemRoles={systemRoles}
          customRoles={customRoles}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          hasPermission={hasPermission}
        />
      )}
    </div>
  );
}

function TableView({
  categories,
  groupedPermissions,
  systemRoles,
  customRoles,
  expandedCategories,
  toggleCategory,
  hasPermission,
}: ViewProps) {
  const allRoles = [...systemRoles, ...customRoles];

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50 border-b border-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 min-w-[300px]">
                Permission
              </th>
              {allRoles.map((role: Role) => (
                <th
                  key={role.id}
                  className="px-4 py-3 text-center text-sm font-semibold text-gray-300 min-w-[120px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      {role.isSystemRole && (
                        <Shield className="h-3 w-3 text-purple-400" />
                      )}
                      <span>{role.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-normal">
                      {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category);
              const categoryPermissions = groupedPermissions[category] || [];

              return (
                <React.Fragment key={category}>
                  {/* Category header row */}
                  <tr className="bg-gray-900/30 border-t border-gray-700">
                    <td
                      colSpan={allRoles.length + 1}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-900/50 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-cinematic-gold-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-cinematic-gold-400" />
                        )}
                        <span className="font-semibold text-white">{category}</span>
                        <span className="text-xs text-gray-500">
                          ({categoryPermissions.length} permission{categoryPermissions.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Permission rows */}
                  {isExpanded &&
                    categoryPermissions.map((permission: Permission) => (
                      <tr
                        key={permission.id}
                        className="border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">
                              {permission.displayName}
                            </span>
                            {permission.description && (
                              <span className="text-xs text-gray-500 mt-0.5">
                                {permission.description}
                              </span>
                            )}
                          </div>
                        </td>
                        {allRoles.map((role: Role) => (
                          <td key={role.id} className="px-4 py-3 text-center">
                            {hasPermission(role, permission.id) ? (
                              <Check className="h-5 w-5 text-green-400 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-600 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardsView({
  categories,
  groupedPermissions,
  systemRoles,
  customRoles,
  expandedCategories,
  toggleCategory,
  hasPermission,
}: ViewProps) {
  const allRoles = [...systemRoles, ...customRoles];

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category);
        const categoryPermissions = groupedPermissions[category] || [];

        return (
          <div
            key={category}
            className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
          >
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-900/30 hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-cinematic-gold-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-cinematic-gold-400" />
                )}
                <span className="font-semibold text-white">{category}</span>
              </div>
              <span className="text-xs text-gray-500">
                {categoryPermissions.length} permission{categoryPermissions.length !== 1 ? "s" : ""}
              </span>
            </button>

            {/* Permissions */}
            {isExpanded && (
              <div className="divide-y divide-gray-700/50">
                {categoryPermissions.map((permission: Permission) => (
                  <div key={permission.id} className="p-4">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-white mb-1">
                        {permission.displayName}
                      </h4>
                      {permission.description && (
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      )}
                    </div>

                    {/* Roles grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {allRoles.map((role: Role) => (
                        <div
                          key={role.id}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                            hasPermission(role, permission.id)
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-gray-900/50 border-gray-700 text-gray-500"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {hasPermission(role, permission.id) ? (
                              <Check className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <X className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{role.name}</span>
                            {role.isSystemRole && (
                              <Shield className="h-3 w-3 flex-shrink-0 text-purple-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
