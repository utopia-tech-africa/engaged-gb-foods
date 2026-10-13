"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserResponseDto } from "@/lib/api/generated/model";
import { isFieldUserRole, USER_ROLE_LABELS } from "@/lib/users/roles";

type UsersTableProps = {
  users: UserResponseDto[];
  canWrite: boolean;
  currentUserId: string | undefined;
  pendingUserId: string | null;
  onEdit: (user: UserResponseDto) => void;
  onSetCredential: (user: UserResponseDto) => void;
  onToggleActive: (user: UserResponseDto) => void;
};

const headClass = "text-xs uppercase tracking-wide text-brand-ink";

export const UsersTable = ({
  users,
  canWrite,
  currentUserId,
  pendingUserId,
  onEdit,
  onSetCredential,
  onToggleActive,
}: UsersTableProps) => (
  <Card className="overflow-hidden p-0">
    <Table>
      <TableHeader className="bg-brand-muted/40">
        <TableRow>
          <TableHead className={headClass}>Name</TableHead>
          <TableHead className={headClass}>Role</TableHead>
          <TableHead className={headClass}>Sign-in</TableHead>
          <TableHead className={headClass}>Status</TableHead>
          {canWrite ? <TableHead className={headClass}>Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={canWrite ? 5 : 4} className="text-brand-ink">
              No people match these filters.
            </TableCell>
          </TableRow>
        ) : null}
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id}>
              <TableCell>
                <span className="block font-medium">{user.fullName}</span>
                {user.phone ? <span className="text-xs text-brand-ink">{user.phone}</span> : null}
              </TableCell>
              <TableCell>{USER_ROLE_LABELS[user.role]}</TableCell>
              <TableCell className="font-mono text-xs text-brand-ink">
                {user.staffId ?? user.email ?? "—"}
              </TableCell>
              <TableCell className="space-x-1">
                <Badge variant={user.isActive ? "secondary" : "outline"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                {user.lockedAt ? <Badge variant="destructive">Locked</Badge> : null}
                {user.hasPin || user.hasPassword ? null : (
                  <Badge variant="outline">No credential</Badge>
                )}
              </TableCell>
              {canWrite ? (
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onSetCredential(user)}>
                      {isFieldUserRole(user.role) ? "Set PIN" : "Set password"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pendingUserId === user.id || (isSelf && user.isActive)}
                      onClick={() => onToggleActive(user)}
                    >
                      {user.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Card>
);
