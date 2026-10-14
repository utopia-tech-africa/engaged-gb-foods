"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/list-skeleton";
import { UserCreateDialog } from "@/components/people/user-create-dialog";
import { UserCredentialDialog } from "@/components/people/user-credential-dialog";
import { UserEditDialog } from "@/components/people/user-edit-dialog";
import { UsersTable } from "@/components/people/users-table";
import { RequireAuth } from "@/components/require-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserResponseDto } from "@/lib/api/generated/model";
import {
  getGetUsersQueryKey,
  useGetUsers,
  usePatchUsersById,
} from "@/lib/api/generated/users/users";
import { canWriteNetwork, OPS_PEOPLE_ROLES } from "@/lib/network/roles";
import { ALL_USER_ROLES, isUserRole, USER_ROLE_LABELS } from "@/lib/users/roles";

const ALL_FILTER = "__all__";
const STATUS_OPTIONS = [
  { value: ALL_FILTER, label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
const ROLE_OPTIONS = [
  { value: ALL_FILTER, label: "All roles" },
  ...ALL_USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] })),
];

export default function OpsPeoplePage() {
  const { accessToken, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserResponseDto | null>(null);
  const [credentialFor, setCredentialFor] = useState<UserResponseDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const writeEnabled = currentUser ? canWriteNetwork(currentUser.role) : false;
  const updateUser = usePatchUsersById();

  const usersQuery = useGetUsers(
    {
      role: isUserRole(roleFilter) ? roleFilter : undefined,
      isActive: statusFilter === ALL_FILTER ? undefined : statusFilter === "active",
      q: search.trim() || undefined,
    },
    { query: { enabled: Boolean(accessToken) } },
  );
  const users = usersQuery.data ?? [];

  const toggleActive = async (target: UserResponseDto): Promise<void> => {
    setActionError(null);
    try {
      await updateUser.mutateAsync({ id: target.id, data: { isActive: !target.isActive } });
      await queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
    } catch (mutationError) {
      setActionError(
        mutationError instanceof Error ? mutationError.message : "Unable to update user",
      );
    }
  };

  const error = actionError ?? usersQuery.error?.message;

  return (
    <RequireAuth roles={OPS_PEOPLE_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">People</h1>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full space-y-2 sm:w-64">
            <Label htmlFor="people-search">Search</Label>
            <Input
              id="people-search"
              type="search"
              placeholder="Name, staff ID, or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="w-full space-y-2 sm:w-52">
            <Label>Role</Label>
            <Select
              items={ROLE_OPTIONS}
              value={roleFilter}
              onValueChange={(value) => value && setRoleFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-2 sm:w-44">
            <Label>Status</Label>
            <Select
              items={STATUS_OPTIONS}
              value={statusFilter}
              onValueChange={(value) => value && setStatusFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {writeEnabled ? <UserCreateDialog /> : null}
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {usersQuery.isLoading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No people match these filters"
            description="Clear the filters, or create a user if you can edit people."
          />
        ) : (
          <UsersTable
            users={users}
            canWrite={writeEnabled}
            currentUserId={currentUser?.id}
            pendingUserId={updateUser.isPending ? (updateUser.variables?.id ?? null) : null}
            onEdit={setEditing}
            onSetCredential={setCredentialFor}
            onToggleActive={(target) => void toggleActive(target)}
          />
        )}

        {editing ? <UserEditDialog user={editing} onClose={() => setEditing(null)} /> : null}
        {credentialFor ? (
          <UserCredentialDialog user={credentialFor} onClose={() => setCredentialFor(null)} />
        ) : null}
      </div>
    </RequireAuth>
  );
}
