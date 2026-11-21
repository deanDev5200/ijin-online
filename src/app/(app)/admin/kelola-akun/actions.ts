"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type {
  AccountActionState,
  ImportAccountsState,
} from "@/lib/accounts/form-state";
import {
  parseStudentImportWorkbook,
  StudentImportError,
} from "@/lib/accounts/import";
import { INITIAL_PASSWORD, generateUsername } from "@/lib/accounts/username";
import { requireRole } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import {
  accountStatusSchema,
  createAccountSchema,
  grhaSchema,
  kelasSchema,
  nisSchema,
  nipSchema,
  updateAccountSchema,
} from "@/lib/validations/account";

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function accountValues(formData: FormData) {
  return {
    role: getFormValue(formData, "role"),
    fullName: getFormValue(formData, "fullName"),
    nis: getFormValue(formData, "nis"),
    grha: getFormValue(formData, "grha"),
    kelas: getFormValue(formData, "kelas"),
    nip: getFormValue(formData, "nip"),
  };
}

export async function createAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  await requireRole("ADMIN");

  const values = accountValues(formData);
  const parsed = createAccountSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data akun yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const data = parsed.data;
  const existingProfile =
    data.role === "SISWA"
      ? await prisma.studentProfile.findUnique({
          where: { nis: data.nis },
          select: { userId: true },
        })
      : await prisma.staffProfile.findUnique({
          where: { nip: data.nip },
          select: { userId: true },
        });

  if (existingProfile) {
    return {
      status: "error",
      message:
        data.role === "SISWA"
          ? "NIS sudah terdaftar pada akun lain."
          : "NIP sudah terdaftar pada akun lain.",
      fieldErrors:
        data.role === "SISWA"
          ? { nis: ["NIS sudah terdaftar."] }
          : { nip: ["NIP sudah terdaftar."] },
      values,
    };
  }

  const existingUsers = await prisma.user.findMany({
    select: { username: true },
  });

  let username: string;

  try {
    username = generateUsername(
      data.fullName,
      existingUsers.map((user) => user.username),
    );
  } catch {
    return {
      status: "error",
      message: "Username otomatis tidak dapat dibuat dari nama tersebut.",
      values,
    };
  }

  const passwordHash = await hashPassword(INITIAL_PASSWORD);

  try {
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: data.role,
        fullName: data.fullName,
        mustChangePassword: true,
        studentProfile:
          data.role === "SISWA"
            ? {
                create: {
                  nis: data.nis,
                  grha: data.grha,
                  kelas: data.kelas,
                },
              }
            : undefined,
        staffProfile:
          data.role !== "SISWA"
            ? {
                create: {
                  nip: data.nip,
                  canBeMentor: data.role === "PEMBINA",
                },
              }
            : undefined,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        status: "error",
        message: "Username, NIS, atau NIP sudah digunakan akun lain.",
        values,
      };
    }

    console.error(error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat membuat akun.",
      values,
    };
  }

  revalidatePath("/admin/kelola-akun");
  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/", "layout");

  redirect("/admin/kelola-akun?created=1");
}

export async function updateAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  await requireRole("ADMIN");

  const values = accountValues(formData);
  const parsed = updateAccountSchema.safeParse({
    accountId: getFormValue(formData, "accountId"),
    ...values,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data akun yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const data = parsed.data;
  const account = await prisma.user.findUnique({
    where: { id: data.accountId },
    select: {
      id: true,
      role: true,
      studentProfile: { select: { userId: true } },
      staffProfile: { select: { userId: true } },
    },
  });

  if (!account) {
    return { status: "error", message: "Akun tidak ditemukan.", values };
  }

  const fieldErrors: Record<string, string[]> = {};

  if (account.role === "SISWA") {
    const nis = nisSchema.safeParse(data.nis);
    const grha = grhaSchema.safeParse(data.grha);
    const kelas = kelasSchema.safeParse(data.kelas);

    if (!nis.success) {
      fieldErrors.nis = nis.error.issues.map((issue) => issue.message);
    }
    if (!grha.success) {
      fieldErrors.grha = grha.error.issues.map((issue) => issue.message);
    }
    if (!kelas.success) {
      fieldErrors.kelas = kelas.error.issues.map((issue) => issue.message);
    }
  } else if (account.role !== "ADMIN") {
    const nip = nipSchema.safeParse(data.nip);

    if (!nip.success) {
      fieldErrors.nip = nip.error.issues.map((issue) => issue.message);
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data akun yang Anda masukkan.",
      fieldErrors,
      values,
    };
  }

  const existingProfile =
    account.role === "SISWA"
      ? await prisma.studentProfile.findFirst({
          where: {
            nis: data.nis,
            userId: { not: account.id },
          },
          select: { userId: true },
        })
      : account.role !== "ADMIN"
        ? await prisma.staffProfile.findFirst({
            where: {
              nip: data.nip,
              userId: { not: account.id },
            },
            select: { userId: true },
          })
        : null;

  if (existingProfile) {
    return {
      status: "error",
      message:
        account.role === "SISWA"
          ? "NIS sudah terdaftar pada akun lain."
          : "NIP sudah terdaftar pada akun lain.",
      fieldErrors:
        account.role === "SISWA"
          ? { nis: ["NIS sudah terdaftar."] }
          : { nip: ["NIP sudah terdaftar."] },
      values,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: account.id },
        data: {
          fullName: data.fullName,
        },
      });

      if (account.role === "SISWA") {
        await tx.studentProfile.upsert({
          where: { userId: account.id },
          update: {
            nis: data.nis,
            grha: data.grha,
            kelas: data.kelas,
          },
          create: {
            userId: account.id,
            nis: data.nis,
            grha: data.grha,
            kelas: data.kelas,
          },
        });
      } else if (account.role !== "ADMIN") {
        await tx.staffProfile.upsert({
          where: { userId: account.id },
          update: {
            nip: data.nip,
          },
          create: {
            userId: account.id,
            nip: data.nip,
            canBeMentor: account.role === "PEMBINA",
          },
        });
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        status: "error",
        message: "NIS atau NIP sudah digunakan akun lain.",
        values,
      };
    }

    console.error(error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat memperbarui akun.",
      values,
    };
  }

  revalidatePath("/admin/kelola-akun");
  revalidatePath(`/admin/kelola-akun/${account.id}`);
  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Data akun berhasil diperbarui.",
  };
}

export async function resetAccountPasswordAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const admin = await requireRole("ADMIN");

  const accountId = z.string().min(1).safeParse(getFormValue(formData, "accountId"));

  if (!accountId.success) {
    return {
      status: "error",
      message: "Akun tidak ditemukan.",
    };
  }

  if (accountId.data === admin.id) {
    return {
      status: "error",
      message:
        "Gunakan halaman Profil untuk mengganti password akun Anda sendiri.",
    };
  }

  const account = await prisma.user.findUnique({
    where: { id: accountId.data },
    select: { id: true, fullName: true },
  });

  if (!account) {
    return { status: "error", message: "Akun tidak ditemukan." };
  }

  const passwordHash = await hashPassword(INITIAL_PASSWORD);

  await prisma.user.update({
    where: { id: account.id },
    data: {
      passwordHash,
      mustChangePassword: true,
      sessionVersion: { increment: 1 },
    },
  });

  revalidatePath("/admin/kelola-akun");
  revalidatePath(`/admin/kelola-akun/${account.id}`);

  return {
    status: "success",
    message: `Password ${account.fullName} berhasil direset ke ${INITIAL_PASSWORD}. Pengguna wajib membuat username dan password baru saat login berikutnya.`,
  };
}

export async function setAccountActiveAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const admin = await requireRole("ADMIN");

  const parsed = accountStatusSchema.safeParse({
    accountId: getFormValue(formData, "accountId"),
    isActive: getFormValue(formData, "isActive"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Permintaan perubahan status tidak valid.",
    };
  }

  const account = await prisma.user.findUnique({
    where: { id: parsed.data.accountId },
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!account) {
    return { status: "error", message: "Akun tidak ditemukan." };
  }

  const nextActive = parsed.data.isActive === "true";

  if (!nextActive && account.id === admin.id) {
    return {
      status: "error",
      message: "Anda tidak dapat menonaktifkan akun sendiri.",
    };
  }

  if (!nextActive && account.isActive && account.role === "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });

    if (activeAdmins <= 1) {
      return {
        status: "error",
        message:
          "Akun administrator aktif terakhir tidak dapat dinonaktifkan.",
      };
    }
  }

  await prisma.user.update({
    where: { id: account.id },
    data: {
      isActive: nextActive,
      sessionVersion: { increment: 1 },
    },
  });

  revalidatePath("/admin/kelola-akun");
  revalidatePath(`/admin/kelola-akun/${account.id}`);
  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: nextActive
      ? `Akun ${account.fullName} berhasil diaktifkan.`
      : `Akun ${account.fullName} berhasil dinonaktifkan. Riwayat tetap tersimpan.`,
  };
}

export async function importAccountsAction(
  _previousState: ImportAccountsState,
  formData: FormData,
): Promise<ImportAccountsState> {
  await requireRole("ADMIN");

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Pilih berkas Excel (.xlsx) yang akan diimpor.",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      status: "error",
      message: "Ukuran berkas maksimal 5 MB.",
    };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      status: "error",
      message: "Format berkas harus .xlsx. Unduh template resmi aplikasi.",
    };
  }

  let parsed: Awaited<ReturnType<typeof parseStudentImportWorkbook>>;

  try {
    parsed = await parseStudentImportWorkbook(await file.arrayBuffer());
  } catch (error) {
    if (error instanceof StudentImportError) {
      return { status: "error", message: error.message };
    }

    console.error(error);

    return {
      status: "error",
      message: "Berkas tidak dapat diproses. Gunakan template resmi aplikasi.",
    };
  }

  const errors = [...parsed.errors];

  if (parsed.totalRows === 0) {
    return {
      status: "error",
      message: "Berkas tidak berisi data akun siswa.",
      result: {
        created: 0,
        totalRows: 0,
        errors: [],
      },
    };
  }

  const rowsToCreate = await (async () => {
    if (parsed.rows.length === 0) {
      return [];
    }

    const [allUsers, existingStudents] = await Promise.all([
      prisma.user.findMany({
        select: { username: true },
      }),
      prisma.studentProfile.findMany({
        where: {
          nis: {
            in: parsed.rows.map((row) => row.nis),
          },
        },
        select: { nis: true },
      }),
    ]);

    const takenUsernames = allUsers.map((user) => user.username);
    const existingNis = new Set(
      existingStudents.map((student) => student.nis.toLowerCase()),
    );

    return parsed.rows.flatMap((row) => {
      if (existingNis.has(row.nis.toLowerCase())) {
        errors.push({
          row: row.rowNumber,
          message: `NIS "${row.nis}" sudah terdaftar.`,
        });
        return [];
      }

      try {
        const username = generateUsername(row.fullName, takenUsernames);
        return [{ ...row, username }];
      } catch {
        errors.push({
          row: row.rowNumber,
          message: `Username otomatis tidak dapat dibuat dari nama "${row.fullName}".`,
        });
        return [];
      }
    });
  })();

  let created = 0;

  if (rowsToCreate.length > 0) {
    try {
      const passwordHash = await hashPassword(INITIAL_PASSWORD);

      await prisma.$transaction(
        async (tx) => {
          for (const row of rowsToCreate) {
            await tx.user.create({
              data: {
                username: row.username,
                passwordHash,
                role: "SISWA",
                fullName: row.fullName,
                mustChangePassword: true,
                studentProfile: {
                  create: {
                    nis: row.nis,
                    grha: row.grha,
                    kelas: row.kelas,
                  },
                },
              },
            });
          }
        },
        { timeout: 120_000 },
      );

      created = rowsToCreate.length;
    } catch (error) {
      console.error(error);

      if (isUniqueConstraintError(error)) {
        return {
          status: "error",
          message:
            "Impor dibatalkan karena ada NIS yang sudah digunakan. Tidak ada akun yang dibuat.",
          result: {
            created: 0,
            totalRows: parsed.totalRows,
            errors,
          },
        };
      }

      return {
        status: "error",
        message:
          "Impor dibatalkan karena terjadi kesalahan. Tidak ada akun yang dibuat.",
        result: {
          created: 0,
          totalRows: parsed.totalRows,
          errors,
        },
      };
    }
  }

  revalidatePath("/admin/kelola-akun");
  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/", "layout");

  if (created === 0) {
    return {
      status: "error",
      message: `Tidak ada akun yang diimpor. ${errors.length} baris perlu diperbaiki.`,
      result: {
        created: 0,
        totalRows: parsed.totalRows,
        errors,
      },
    };
  }

  return {
    status: "success",
    message:
      errors.length > 0
        ? `${created} akun berhasil diimpor. ${errors.length} baris dilewati karena tidak valid.`
        : `${created} akun berhasil diimpor. Password awal ${INITIAL_PASSWORD}; pengguna wajib membuat username dan password pribadi saat login pertama.`,
    result: {
      created,
      totalRows: parsed.totalRows,
      errors,
    },
  };
}
