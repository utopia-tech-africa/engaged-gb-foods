"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAssessment, deriveAssessmentResult } from "@/lib/assessment/api";
import type { UserSummary } from "@/lib/users/api";

type StepKey = "safetyPass" | "qualityPass" | "recordsPass";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "safetyPass", label: "Mandatory safety" },
  { key: "qualityPass", label: "Mandatory quality" },
  { key: "recordsPass", label: "Mandatory record-keeping" },
];

type AssessmentFormProps = {
  accessToken: string;
  users: UserSummary[];
  onSaved: () => Promise<void>;
};

export const AssessmentForm = ({ accessToken, users, onSaved }: AssessmentFormProps) => {
  const [userId, setUserId] = useState("");
  const [steps, setSteps] = useState<Record<StepKey, boolean>>({
    safetyPass: false,
    qualityPass: false,
    recordsPass: false,
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const result = deriveAssessmentResult(steps);
  const userItems = users.map((user) => ({
    value: user.id,
    label: `${user.fullName}${user.staffId ? ` (${user.staffId})` : ""} — ${user.role.replace("_", " ")}`,
  }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!userId) {
      toast.error("Select a user");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAssessment(accessToken, { userId, ...steps, notes: notes.trim() || undefined });
      toast.success(result === "pass" ? "Passed: user can be dispatched" : "Failed: user blocked");
      setUserId("");
      setSteps({ safetyPass: false, qualityPass: false, recordsPass: false });
      setNotes("");
      await onSaved();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to save assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">Record assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
          <div className="max-w-md space-y-2">
            <Label>User</Label>
            <Select
              items={userItems}
              value={userId}
              onValueChange={(value) => value && setUserId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select QC, handler, or cluster supervisor" />
              </SelectTrigger>
              <SelectContent>
                {userItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">Mandatory steps passed</legend>
            {STEPS.map((step) => (
              <div key={step.key} className="flex items-center gap-2">
                <Checkbox
                  id={`assessment-${step.key}`}
                  checked={steps[step.key]}
                  onCheckedChange={(checked) =>
                    setSteps((current) => ({ ...current, [step.key]: checked }))
                  }
                />
                <Label htmlFor={`assessment-${step.key}`}>{step.label}</Label>
              </div>
            ))}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="assessment-notes">Notes</Label>
            <Textarea
              id="assessment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Record assessment"}
            </Button>
            <Badge variant={result === "pass" ? "default" : "destructive"}>
              {result === "pass" ? "Will pass: dispatchable" : "Will fail: not dispatchable"}
            </Badge>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
