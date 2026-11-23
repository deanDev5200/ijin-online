"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type {
  AccountActionState,
  ImportAccountsState,
} from "@/lib/accounts/form-state";
import {
  parseStaffImportWorkbook,
  parseStudentImportWorkbook,
  StaffImportError,
  StudentImportError,
} from "@/lib/accounts/import";
import { INITIAL_PASSWORD, generateUsername } from "@/lib/accounts/username";
import {
  buildAccountQuery,
  parseAccountFilters,
} from "@/lib/admin/account-filters";
import { requireRole } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import {
  accountIdSchema,
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
  } else if (account.role !== "ADMIN" && data.nip) {
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
      : account.role !== "ADMIN" && data.nip
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
            nip: data.nip || null,
          },
          create: {
            userId: account.id,
            nip: data.nip || null,
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

export async function resetAccountCredentialsAction(
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

  const account = await prisma.user.findUnique({
    where: { id: accountId.data },
    select: { id: true, fullName: true, username: true },
  });

  if (!account) {
    return { status: "error", message: "Akun tidak ditemukan." };
  }

  const allUsers = await prisma.user.findMany({
    where: { id: { not: account.id } },
    select: { username: true },
  });

  let username: string;

  try {
    username = generateUsername(
      account.fullName,
      allUsers.map((user) => user.username),
    );
  } catch {
    return {
      status: "error",
      message: "Username awal tidak dapat dibuat dari nama akun tersebut.",
    };
  }

  const passwordHash = await hashPassword(INITIAL_PASSWORD);

  try {
    await prisma.user.update({
      where: { id: account.id },
      data: {
        username,
        passwordHash,
        mustChangePassword: true,
        sessionVersion: { increment: 1 },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        status: "error",
        message: "Username awal sudah digunakan. Coba ulangi beberapa saat lagi.",
      };
    }

    console.error(error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat mereset kredensial akun.",
    };
  }

  revalidatePath("/admin/kelola-akun");
  revalidatePath(`/admin/kelola-akun/${account.id}`);
  revalidatePath("/", "layout");

  if (account.id === admin.id) {
    // Mengubah kredensial sendiri mengakhiri sesi agar kata sandi lama tidak berlaku.
    redirect("/api/auth/clear-session");
  }

  return {
    status: "success",
    message: `Username ${account.fullName} berhasil direset menjadi ${username} dan passwordnya menjadi ${INITIAL_PASSWORD}. Pengguna wajib membuat username dan password baru saat login berikutnya.`,
  };
}

export async function deleteAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const admin = await requireRole("ADMIN");

  const parsed = accountIdSchema.safeParse({
    accountId: getFormValue(formData, "accountId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Permintaan hapus akun tidak valid.",
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

  if (account.id === admin.id) {
    return {
      status: "error",
      message: "Anda tidak dapat menghapus akun sendiri.",
    };
  }

  if (account.isActive && account.role === "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });

    if (activeAdmins <= 1) {
      return {
        status: "error",
        message: "Akun administrator aktif terakhir tidak dapat dihapus.",
      };
    }
  }

  await prisma.$transaction(
    async (tx) => {
      // Hapus pengajuan yang dibuat akun ini beserta approval, notifikasi,
      // dan relasi siswa di dalamnya (kaskade dari schema.prisma).
      await tx.permissionRequest.deleteMany({
        where: { requesterId: account.id },
      });

      // Lepakkan akun ini dari pengajuan orang lain yang turut melibatkannya.
      await tx.permissionRequestStudent.deleteMany({
        where: { studentId: account.id },
      });

      // Notifikasi milik akun ini tidak ikut terhapus saat pengajuan lain dihapus.
      await tx.notification.deleteMany({ where: { userId: account.id } });

      // Profil siswa/pegawai ikut terhapus; referensi mentor dan approver
      // pada data lain otomatis menjadi null (onDelete: SetNull).
      await tx.user.delete({ where: { id: account.id } });
    },
    { timeout: 120_000 },
  );

  revalidatePath("/admin/kelola-akun");
  revalidatePath("/", "layout");

  const returnFilters = parseAccountFilters({
    q: getFormValue(formData, "q"),
    role: getFormValue(formData, "role"),
    status: getFormValue(formData, "status"),
  });
  const returnPage = getFormValue(formData, "page") || "1";
  const returnQuery = buildAccountQuery(returnFilters, {
    page: returnPage,
    deleted: "1",
  });

  redirect(`/admin/kelola-akun${returnQuery}`);
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

export async function importStaffAccountsAction(
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

  let parsed: Awaited<ReturnType<typeof parseStaffImportWorkbook>>;

  try {
    parsed = await parseStaffImportWorkbook(await file.arrayBuffer());
  } catch (error) {
    if (error instanceof StaffImportError) {
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
      message: "Berkas tidak berisi data akun tenaga pendidik.",
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

    const [allUsers, existingStaff] = await Promise.all([
      prisma.user.findMany({
        select: { username: true },
      }),
      prisma.staffProfile.findMany({
        where: {
          nip: {
            in: parsed.rows.map((row) => row.nip).filter(Boolean),
          },
        },
        select: { nip: true },
      }),
    ]);

    const takenUsernames = allUsers.map((user) => user.username);
    const existingNips = new Set(
      existingStaff.flatMap((staff) =>
        staff.nip ? [staff.nip.toLowerCase()] : [],
      ),
    );

    return parsed.rows.flatMap((row) => {
      if (row.nip && existingNips.has(row.nip.toLowerCase())) {
        errors.push({
          row: row.rowNumber,
          message: `NIP "${row.nip}" sudah terdaftar.`,
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
                role: row.role,
                fullName: row.fullName,
                mustChangePassword: true,
                staffProfile: {
                  create: {
                    nip: row.nip || null,
                    canBeMentor: row.role === "PEMBINA",
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
            "Impor dibatalkan karena ada NIP atau username yang sudah digunakan. Tidak ada akun yang dibuat.",
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
        ? `${created} akun tenaga pendidik berhasil diimpor. ${errors.length} baris dilewati karena tidak valid.`
        : `${created} akun tenaga pendidik berhasil diimpor. Password awal ${INITIAL_PASSWORD}; pengguna wajib membuat username dan password pribadi saat login pertama.`,
    result: {
      created,
      totalRows: parsed.totalRows,
      errors,
    },
  };
}
