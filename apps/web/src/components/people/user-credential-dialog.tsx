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

type UserCredentialDialogProps = {
  user: UserResponseDto;
  onClose: () => void;
};

/** Sets a new PIN (field roles) or password (desk roles). Mount only while open. */
export const UserCredentialDialog = ({ user, onClose }: UserCredentialDialogProps) => {
  const queryClient = useQueryClient();
  const updateUser = usePatchUsersById();
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState("");

  const fieldRole = isFieldUserRole(user.role);
  const label = fieldRole ? "PIN" : "password";

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    const data: UpdateUserDto = fieldRole ? { pin: secret } : { password: secret };
    try {
      await updateUser.mutateAsync({ id: user.id, data });
      await queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      onClose();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : `Unable to set ${label}`);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set {label}</DialogTitle>
          <DialogDescription>
            {fieldRole
              ? `New PIN for ${user.fullName}. This also unlocks the account and signs them out.`
              : `New password for ${user.fullName}. This signs them out of existing sessions.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="credential-secret">
              {fieldRole ? "New PIN (4–6 digits)" : "New password (8+ characters)"}
            </Label>
            <Input
              id="credential-secret"
              required
              autoComplete="new-password"
              {...(fieldRole
                ? { inputMode: "numeric", pattern: "\\d{4,6}" }
                : { type: "password", minLength: 8 })}
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={updateUser.isPending} className="w-fit">
            {updateUser.isPending ? "Saving…" : `Set ${label}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
