import type { ReactNode } from "react";
import type { Role } from "@/generated/prisma/enums";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  Info,
  MapPin,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";

import { ApprovalTimeline } from "@/components/permission/approval-timeline";
import { RequestStatusBadge } from "@/components/permission/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  fieldLabel,
  getPermissionTypeConfig,
  hasField,
  type PermissionField,
} from "@/lib/permissions/config";
import {
  formatDateOnly,
  formatDateTime,
  formatTimeRange,
} from "@/lib/permissions/dates";
import type { PermissionRequestDetail } from "@/lib/permissions/queries";
import { cn } from "@/lib/utils";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function InfoItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

export function RequestDetail({
  request,
  highlightRole,
  children,
}: {
  request: PermissionRequestDetail;
  highlightRole?: Role;
  children?: ReactNode;
}) {
  const students = [...request.students].sort((a, b) => {
    if (a.isRequester !== b.isRequester) {
      return a.isRequester ? -1 : 1;
    }

    return a.student.fullName.localeCompare(b.student.fullName, "id");
  });

  const mentorNip = request.mentor.staffProfile?.nip;
  const config = getPermissionTypeConfig(request.type);
  const approvalCount = request.approvals.length;

  const hasValue = (value: string | null) => Boolean(value?.trim());

  const allDetailFields: Array<{
    field: PermissionField;
    icon: typeof CalendarDays;
    value: ReactNode;
  }> = [
    {
      field: "purpose",
      icon: FileText,
      value: request.purpose,
    },
    {
      field: "place",
      icon: MapPin,
      value: request.place,
    },
    {
      field: "visitorName",
      icon: UserRound,
      value: request.visitorName,
    },
    {
      field: "phoneUse",
      icon: Phone,
      value: request.phoneUse,
    },
    {
      field: "additionalNotes",
      icon: ClipboardList,
      value: request.additionalNotes,
    },
  ];

  const detailFields = allDetailFields.filter(({ field, value }) => {
    const text = typeof value === "string" ? value : "";

    if (field === "purpose" && !hasField(config, "purpose")) {
      return text !== `Pengajuan ${request.type.name}`;
    }

    return hasField(config, field) || hasValue(text);
  });

  const showTime =
    hasField(config, "time") || Boolean(request.startTime || request.endTime);
  const showStartDate = hasField(config, "startDate") || Boolean(request.startDate);
  const hasDateRange =
    Boolean(request.endDate) &&
    request.endDate.getTime() !== request.startDate.getTime();
  const showEndDate = hasField(config, "endDate") || hasDateRange;

  return (
    <div className="space-y-6">
      <Card className="bg-linear-to-br from-primary/5 via-background to-background">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={request.status} />
            <Badge variant="outline" className="gap-1.5">
              <ClipboardList className="size-3" />
              {request.type.name}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {approvalCount} tahap persetujuan
            </Badge>
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {hasField(config, "purpose")
                ? request.purpose
                : request.type.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Diajukan oleh{" "}
              <span className="font-medium text-foreground">
                {request.requester.fullName}
              </span>{" "}
              pada {formatDateTime(request.createdAt)}
            </p>
          </div>

          <Separator />

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {showStartDate ? (
              <InfoItem
                icon={CalendarDays}
                label={fieldLabel(config, "startDate")}
                value={formatDateOnly(request.startDate)}
              />
            ) : null}
            {showEndDate ? (
              <InfoItem
                icon={CalendarDays}
                label={fieldLabel(config, "endDate")}
                value={formatDateOnly(request.endDate)}
              />
            ) : null}
            {!showStartDate && !showEndDate ? (
              <InfoItem
                icon={CalendarDays}
                label="Tanggal pengajuan"
                value={formatDateOnly(request.createdAt)}
              />
            ) : null}
            {showTime ? (
              <InfoItem
                icon={Clock3}
                label={fieldLabel(config, "time")}
                value={formatTimeRange(request.startTime, request.endTime)}
              />
            ) : null}
            <InfoItem
              icon={UserRound}
              label="Pembina/Pendamping"
              value={request.mentor.fullName}
            />
          </dl>
        </CardContent>
      </Card>

      {request.status === "REJECTED" && request.rejectionReason ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Pengajuan ditolak</AlertTitle>
          <AlertDescription>{request.rejectionReason}</AlertDescription>
        </Alert>
      ) : null}

      {config.formGuide ? (
        <Alert>
          <Info />
          <AlertTitle>Panduan formulir {request.type.name}</AlertTitle>
          <AlertDescription>{config.formGuide}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersRound className="size-4 text-primary" />
                Siswa yang terlibat
              </CardTitle>
              <CardDescription>
                {students.length} siswa tercantum dalam pengajuan ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {students.map(({ isRequester, student }) => {
                const profile = student.studentProfile;
                const meta = profile
                  ? `${profile.nis} · ${profile.kelas} · ${profile.grha}`
                  : `@${student.username}`;

                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-xl border bg-background p-3"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium">
                          {student.fullName}
                        </p>
                        {isRequester ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Pengaju
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {meta}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail formulir</CardTitle>
              <CardDescription>
                Data yang diisi sesuai ketentuan jenis izin ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {detailFields.map(({ field, icon: Icon, value }) => (
                  <InfoItem
                    key={field}
                    icon={Icon}
                    label={fieldLabel(config, field)}
                    value={value || "—"}
                    className={field === "additionalNotes" || field === "phoneUse" ? "sm:col-span-2" : undefined}
                  />
                ))}
                <InfoItem
                  icon={UserRound}
                  label="Pembina/Pendamping"
                  value={
                    <span>
                      {request.mentor.fullName}
                      {mentorNip ? (
                        <span className="block text-xs font-normal text-muted-foreground">
                          NIP {mentorNip}
                        </span>
                      ) : null}
                    </span>
                  }
                />
                <InfoItem
                  icon={Clock3}
                  label="Diajukan pada"
                  value={formatDateTime(request.createdAt)}
                />
                <InfoItem
                  icon={Clock3}
                  label="Terakhir diperbarui"
                  value={formatDateTime(request.updatedAt)}
                />
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alur persetujuan</CardTitle>
              <CardDescription>
                Persetujuan mengikuti konfigurasi jenis izin{" "}
                <span className="font-medium text-foreground">
                  {request.type.name}
                </span>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApprovalTimeline
                request={request}
                viewerRole={highlightRole}
              />
            </CardContent>
          </Card>

          {children}
        </div>
      </div>
    </div>
  );
}
