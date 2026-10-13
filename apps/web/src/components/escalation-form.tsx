"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getGetEscalationsQueryKey,
  usePostEscalations,
} from "@/lib/api/generated/escalations/escalations";
import type { EscalationTrigger, MyDepotResponseDto } from "@/lib/api/generated/model";
import { TRIGGER_LABELS, TRIGGERS } from "@/lib/escalation/constants";
import { uploadPhoto } from "@/lib/uploads";
import { cn } from "@/lib/utils";

type EscalationFormProps = {
  depots: MyDepotResponseDto[];
  initialDepotId: string;
  initialVisitId: string;
};

const triggerItems = TRIGGERS.map((value) => ({ value, label: TRIGGER_LABELS[value] }));

export const EscalationForm = ({ depots, initialDepotId, initialVisitId }: EscalationFormProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const postEscalation = usePostEscalations();
  const [depotId, setDepotId] = useState(initialDepotId);
  const [visitId, setVisitId] = useState(initialVisitId);
  const [trigger, setTrigger] = useState<EscalationTrigger | "">("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const depotItems = depots.map((depot) => ({
    value: depot.id,
    label: `${depot.name} (${depot.code})`,
  }));
  const submitting = isUploading || postEscalation.isPending;

  const onPhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotos(Array.from(event.target.files ?? []));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!depotId) {
      toast.error("Select a depot");
      return;
    }
    if (!trigger) {
      toast.error("Select what went wrong");
      return;
    }
    if (!note.trim()) {
      toast.error("Add a short note");
      return;
    }

    try {
      setIsUploading(true);
      const evidenceKeys = await Promise.all(
        photos.map((file) => uploadPhoto(file, "escalation_photo")),
      ).finally(() => setIsUploading(false));

      await postEscalation.mutateAsync({
        data: {
          depotId,
          trigger,
          note: note.trim(),
          ...(visitId.trim() ? { visitId: visitId.trim() } : {}),
          ...(evidenceKeys.length > 0 ? { evidenceKeys } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetEscalationsQueryKey() });
      toast.success("Exception reported to ops");
      router.push("/field");
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Could not report exception",
      );
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/field" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
        ← Back to field workspace
      </Link>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
            <div className="space-y-2">
              <Label>Depot</Label>
              <Select
                items={depotItems}
                value={depotId}
                onValueChange={(value) => value && setDepotId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select depot" />
                </SelectTrigger>
                <SelectContent>
                  {depotItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escalation-visit">Visit id (optional)</Label>
              <Input
                id="escalation-visit"
                value={visitId}
                onChange={(event) => setVisitId(event.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>What went wrong</Label>
              <Select
                items={triggerItems}
                value={trigger}
                onValueChange={(value) => value && setTrigger(value as EscalationTrigger)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select exception type" />
                </SelectTrigger>
                <SelectContent>
                  {triggerItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escalation-note">Note</Label>
              <Textarea
                id="escalation-note"
                required
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="escalation-photos">Photos (optional)</Label>
              <input
                id="escalation-photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={onPhotosChange}
                className="block w-full text-sm text-brand-ink file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              />
              {photos.length > 0 ? (
                <p className="text-xs text-brand-ink/70">
                  {photos.length} photo{photos.length === 1 ? "" : "s"} selected
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Report exception"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
