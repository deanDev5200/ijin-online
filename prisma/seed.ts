import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

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

  const defaultType = await prisma.permissionType.upsert({
    where: { name: "Dispensasi Kegiatan Asrama" },
    update: {},
    create: {
      name: "Dispensasi Kegiatan Asrama",
      description:
        "Izin untuk mengikuti kegiatan di luar rutinitas asrama, baik di dalam maupun di luar lingkungan sekolah.",
      sortOrder: 0,
    },
  });
  console.log(`  - jenis izin default: ${defaultType.name}`);

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345";
  const adminFullName = process.env.ADMIN_FULL_NAME ?? "Administrator";

  console.log("Menyiapkan akun admin...");
  await seedUser({
    username: adminUsername,
    password: adminPassword,
    role: "ADMIN",
    fullName: adminFullName,
    mustChangePassword: true,
  });

  if (process.env.SEED_DEMO === "true") {
    console.log("Menyiapkan akun demo...");

    await seedUser({
      username: "siswa01",
      password: "demo123",
      role: "SISWA",
      fullName: "Ahmad Fauzi",
      student: {
        nis: "24001",
        grha: "Airsanya",
        kelas: "X IPA 1",
      },
    });

    await seedUser({
      username: "siswa02",
      password: "demo123",
      role: "SISWA",
      fullName: "Bunga Lestari",
      student: {
        nis: "24002",
        grha: "Daksina",
        kelas: "X IPA 1",
      },
    });

    await seedUser({
      username: "pembina01",
      password: "demo123",
      role: "PEMBINA",
      fullName: "Sari Wulandari",
      staff: { nip: "198501012010012001" },
    });

    await seedUser({
      username: "staff01",
      password: "demo123",
      role: "STAFF_ASRAMA",
      fullName: "Andi Pratama",
      staff: { nip: "198703152011011002" },
    });

    await seedUser({
      username: "kepala01",
      password: "demo123",
      role: "KEPALA_ASRAMA",
      fullName: "Hendra Gunawan",
      staff: { nip: "197905202005011003" },
    });
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
