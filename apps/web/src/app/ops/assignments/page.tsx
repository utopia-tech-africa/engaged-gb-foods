"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/list-skeleton";
import { AssignmentCreateForm } from "@/components/people/assignment-create-form";
import { AssignmentEndDialog } from "@/components/people/assignment-end-dialog";
import { AssignmentsTable } from "@/components/people/assignments-table";
import { RequireAuth } from "@/components/require-auth";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAssignments } from "@/lib/api/generated/assignments/assignments";
import type { AssignmentResponseDto } from "@/lib/api/generated/model";
import { useGetUsers } from "@/lib/api/generated/users/users";
import { canWriteNetwork, OPS_PEOPLE_ROLES } from "@/lib/network/roles";
import { FIELD_USER_ROLES } from "@/lib/users/roles";

const ALL_FILTER = "__all__";

export default function OpsAssignmentsPage() {
  const { accessToken, user: currentUser } = useAuth();
  const [userFilter, setUserFilter] = useState(ALL_FILTER);
  const [ending, setEnding] = useState<AssignmentResponseDto | null>(null);

  const enabled = Boolean(accessToken);
  const writeEnabled = currentUser ? canWriteNetwork(currentUser.role) : false;

  const usersQuery = useGetUsers({ isActive: true }, { query: { enabled } });
  const assignmentsQuery = useGetAssignments(
    { userId: userFilter === ALL_FILTER ? undefined : userFilter },
    { query: { enabled } },
  );

  const fieldUsers = (usersQuery.data ?? []).filter((user) => FIELD_USER_ROLES.includes(user.role));
  const userOptions = [
    { value: ALL_FILTER, label: "Everyone" },
    ...fieldUsers.map((user) => ({
      value: user.id,
      label: `${user.fullName}${user.staffId ? ` · ${user.staffId}` : ""}`,
    })),
  ];
  const error = usersQuery.error?.message ?? assignmentsQuery.error?.message;

  return (
    <RequireAuth roles={OPS_PEOPLE_ROLES}>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Assignments
        </h1>
        {writeEnabled ? <AssignmentCreateForm users={fieldUsers} enabled={enabled} /> : null}

        <div className="max-w-md space-y-2">
          <Label>Filter by person</Label>
          <Select
            items={userOptions}
            value={userFilter}
            onValueChange={(value) => value && setUserFilter(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Everyone" />
            </SelectTrigger>
            <SelectContent>
              {userOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {assignmentsQuery.isLoading ? (
          <TableSkeleton columns={4} rows={5} />
        ) : (assignmentsQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No assignments yet"
            description="Link a field user to a distributor, cluster, or region."
          />
        ) : (
          <AssignmentsTable
            assignments={assignmentsQuery.data ?? []}
            canWrite={writeEnabled}
            onEnd={setEnding}
          />
        )}

        {ending ? (
          <AssignmentEndDialog assignment={ending} onClose={() => setEnding(null)} />
        ) : null}
      </div>
    </RequireAuth>
  );
}
