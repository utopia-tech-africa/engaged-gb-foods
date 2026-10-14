import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpsAttendanceTodayDto, OpsDailyReturnSubmissionDto } from "@/lib/api/generated/model";

type DailyReturnProgressProps = {
  submission: OpsDailyReturnSubmissionDto;
  attendance: OpsAttendanceTodayDto;
};

export const DailyReturnProgress = ({ submission, attendance }: DailyReturnProgressProps) => {
  const { regionsSubmitted, regionsTotal } = submission;
  const percent = regionsTotal === 0 ? 0 : Math.round((regionsSubmitted / regionsTotal) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base">Daily return and attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Regional returns submitted</span>
            <span className="font-semibold tabular-nums text-foreground">
              {regionsSubmitted} / {regionsTotal}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Regional daily returns submitted"
            aria-valuemin={0}
            aria-valuemax={regionsTotal}
            aria-valuenow={regionsSubmitted}
            className="h-2.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
          <Link href="/ops/daily-return" className="text-xs font-medium text-brand hover:underline">
            Open daily returns
          </Link>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/60 p-3">
            <dt className="text-xs text-muted-foreground">Check-ins</dt>
            <dd className="font-display text-xl font-semibold tabular-nums">
              {attendance.checkIns}
            </dd>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <dt className="text-xs text-muted-foreground">Check-outs</dt>
            <dd className="font-display text-xl font-semibold tabular-nums">
              {attendance.checkOuts}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
