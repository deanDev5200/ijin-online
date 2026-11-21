import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import { generateUsername, INITIAL_PASSWORD } from "../src/lib/accounts/username";
import {
  PDF_PERMISSION_TYPES,
  serializeConfig,
} from "../src/lib/permissions/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const BCRYPT_ROUNDS = 12;

type SeedUser = {
  username: string;
  password: string;
  role: "SISWA" | "PEMBINA" | "STAFF_ASRAMA" | "KEPALA_ASRAMA" | "ADMIN";
  fullName: string;
  mustChangePassword?: boolean;
  student?: {
    nis: string;
    grha: string;
    kelas: string;
  };
  staff?: {
    nip: string;
  };
};

async function seedUser(input: SeedUser) {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
    select: { id: true },
  });

  if (existing) {
    console.log(`  - ${input.username} sudah ada, dilewati`);
    return;
  }

  if (input.password.length < 6) {
    throw new Error(`Password untuk ${input.username} minimal 6 karakter`);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      username: input.username,
      passwordHash,
      role: input.role,
      fullName: input.fullName,
      mustChangePassword: input.mustChangePassword ?? false,
      studentProfile: input.student
        ? {
            create: input.student,
          }
        : undefined,
      staffProfile: input.staff
        ? {
            create: input.staff,
          }
        : undefined,
    },
  });

  console.log(`  + ${input.username} (${input.role}) dibuat`);
}

async function main() {
  console.log("Menyiapkan pengaturan perizinan...");
  await prisma.permissionSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  for (const permissionType of PDF_PERMISSION_TYPES) {
    const type = await prisma.permissionType.upsert({
      where: { name: permissionType.name },
      update: {},
      create: {
        name: permissionType.name,
        description: permissionType.description,
        sortOrder: permissionType.sortOrder,
        ...serializeConfig(permissionType.config),
      },
    });
    console.log(`  - jenis izin: ${type.name}`);
  }

  const adminFullName = process.env.ADMIN_FULL_NAME ?? "Administrator";
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";

  console.log("Menyiapkan akun admin...");
  await seedUser({
    username: adminUsername,
    password: process.env.ADMIN_PASSWORD ?? INITIAL_PASSWORD,
    role: "ADMIN",
    fullName: adminFullName,
    mustChangePassword: true,
  });

  if (process.env.SEED_DEMO === "true") {
    console.log("Menyiapkan akun demo...");

    const demoUsers: SeedUser[] = [
      {
        username: generateUsername("Ahmad Fauzi"),
        password: INITIAL_PASSWORD,
        role: "SISWA",
        fullName: "Ahmad Fauzi",
        mustChangePassword: true,
        student: {
          nis: "24001",
          grha: "Grha A",
          kelas: "X IPA 1",
        },
      },
      {
        username: generateUsername("Bunga Lestari"),
        password: INITIAL_PASSWORD,
        role: "SISWA",
        fullName: "Bunga Lestari",
        mustChangePassword: true,
        student: {
          nis: "24002",
          grha: "Grha A",
          kelas: "X IPA 1",
        },
      },
      {
        username: generateUsername("Sari Wulandari"),
        password: INITIAL_PASSWORD,
        role: "PEMBINA",
        fullName: "Sari Wulandari",
        mustChangePassword: true,
        staff: { nip: "198501012010012001" },
      },
      {
        username: generateUsername("Andi Pratama"),
        password: INITIAL_PASSWORD,
        role: "STAFF_ASRAMA",
        fullName: "Andi Pratama",
        mustChangePassword: true,
        staff: { nip: "198703152011011002" },
      },
      {
        username: generateUsername("Hendra Gunawan"),
        password: INITIAL_PASSWORD,
        role: "KEPALA_ASRAMA",
        fullName: "Hendra Gunawan",
        mustChangePassword: true,
        staff: { nip: "197905202005011003" },
      },
    ];

    for (const user of demoUsers) {
      await seedUser(user);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
