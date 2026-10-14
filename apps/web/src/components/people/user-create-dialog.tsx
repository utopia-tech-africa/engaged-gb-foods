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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateUserDto } from "@/lib/api/generated/model";
import { getGetUsersQueryKey, usePostUsers } from "@/lib/api/generated/users/users";
import type { UserRole } from "@/lib/auth/types";
import { ALL_USER_ROLES, isFieldUserRole, isUserRole, USER_ROLE_LABELS } from "@/lib/users/roles";

const ROLE_OPTIONS = ALL_USER_ROLES.map((value) => ({
  value,
  label: USER_ROLE_LABELS[value],
}));

export const UserCreateDialog = () => {
  const queryClient = useQueryClient();
  const createUser = usePostUsers();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("qc");
  const [fullName, setFullName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");

  const fieldRole = isFieldUserRole(role);

  const reset = (): void => {
    setError(null);
    setFullName("");
    setStaffId("");
    setEmail("");
    setPhone("");
    setPin("");
    setPassword("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    const data: CreateUserDto = {
      fullName,
      role,
      phone: phone.trim() || undefined,
      ...(fieldRole ? { staffId, pin } : { email, password }),
    };
    try {
      await createUser.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      reset();
      setOpen(false);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add person</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add person</DialogTitle>
          <DialogDescription>
            Field roles sign in with staff ID and PIN. Desk roles use email and password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Full name</Label>
            <Input
              id="new-user-name"
              required
              minLength={2}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              items={ROLE_OPTIONS}
              value={role}
              onValueChange={(value) => {
                if (value && isUserRole(value)) {
                  setRole(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
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
          {fieldRole ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-user-staff-id">Staff ID</Label>
                <Input
                  id="new-user-staff-id"
                  required
                  minLength={3}
                  className="font-mono uppercase"
                  placeholder="BTL-0031"
                  value={staffId}
                  onChange={(event) => setStaffId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-pin">PIN (4–6 digits)</Label>
                <Input
                  id="new-user-pin"
                  required
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  autoComplete="new-password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Password (8+ characters)</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="new-user-phone">Phone (optional)</Label>
            <Input
              id="new-user-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={createUser.isPending} className="w-fit">
            {createUser.isPending ? "Saving…" : "Create person"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
