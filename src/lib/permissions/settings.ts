import "server-only";

import { prisma } from "@/lib/db";
import { getPermissionTypeConfig } from "./config";

export const permissionSettingSelect = {
  id: true,
  minLeadDays: true,
  maxRangeDays: true,
  maxStudentsPerRequest: true,
  approvalDeadlineDays: true,
  defaultStartTime: true,
  defaultEndTime: true,
  updatedAt: true,
} as const;

export type PermissionSettings = Awaited<
  ReturnType<typeof getPermissionSettings>
>;

/**
 * Returns the singleton rule set, creating the default row on first use so a
 * fresh database does not require a seed before the settings page works.
 */
export async function getPermissionSettings() {
  return prisma.permissionSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
    select: permissionSettingSelect,
  });
}

export async function getActivePermissionTypes() {
  const types = await prisma.permissionType.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      approvalRoles: true,
      requiredFields: true,
      fieldLabels: true,
      approvalLabels: true,
      formGuide: true,
    },
  });

  return types.map((type) => ({
    id: type.id,
    name: type.name,
    description: type.description,
    config: getPermissionTypeConfig(type),
  }));
}
