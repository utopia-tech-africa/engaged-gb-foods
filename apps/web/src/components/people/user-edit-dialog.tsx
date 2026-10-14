"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateUserDto, UserResponseDto } from "@/lib/api/generated/model";
import { getGetUsersQueryKey, usePatchUsersById } from "@/lib/api/generated/users/users";
import { isFieldUserRole } from "@/lib/users/roles";

type UserEditDialogProps = {
  user: UserResponseDto;
  onClose: () => void;
};

/** Mount only while open so form state starts from the selected user. */
export const UserEditDialog = ({ user, onClose }: UserEditDialogProps) => {
  const queryClient = useQueryClient();
  const updateUser = usePatchUsersById();
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");

  const fieldRole = isFieldUserRole(user.role);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    const data: UpdateUserDto = {
      fullName,
      phone,
      ...(fieldRole ? {} : { email }),
    };
    try {
      await updateUser.mutateAsync({ id: user.id, data });
      await queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      onClose();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to save changes");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.fullName}</DialogTitle>
          <DialogDescription>
            Update profile details. Role and staff ID cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-user-name">Full name</Label>
            <Input
              id="edit-user-name"
              required
              minLength={2}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          {fieldRole ? (
            <div className="space-y-2">
              <Label htmlFor="edit-user-staff-id">Staff ID</Label>
              <Input
                id="edit-user-staff-id"
                readOnly
                className="font-mono uppercase bg-muted"
                value={user.staffId ?? "—"}
              />
              <p className="text-xs text-muted-foreground">Assigned when the person was created.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-user-phone">Phone</Label>
            <Input
              id="edit-user-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={updateUser.isPending} className="w-fit">
            {updateUser.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
