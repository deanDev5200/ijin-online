import { z } from "zod";

/**
 * Username yang dipakai saat masuk. Akun baru mendapat username otomatis
 * dari sistem (maksimal 6 karakter), sedangkan username buatan pengguna
 * maksimal 8 karakter. Validasi login tetap longgar agar username lama yang
 * lebih panjang tidak terkunci.
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter.")
  .max(20, "Username maksimal 20 karakter.")
  .regex(
    /^[A-Za-z0-9._]+$/,
    "Username hanya boleh berisi huruf, angka, titik, dan garis bawah.",
  )
  .transform((value) => value.toLowerCase());

/** Username yang dibuat sendiri oleh pengguna saat login pertama. */
export const chosenUsernameSchema = z
  .string()
  .trim()
  .min(1, "Username wajib diisi.")
  .max(8, "Username maksimal 8 karakter.")
  .regex(
    /^[A-Za-z0-9._]+$/,
    "Username hanya boleh berisi huruf, angka, titik, dan garis bawah.",
  )
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(6, "Password minimal 6 karakter.")
  .max(72, "Password maksimal 72 karakter.");

export const loginSchema = z.object({
  username: usernameSchema,
  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .max(72, "Password maksimal 72 karakter."),
  next: z.string().optional(),
});

/** Ganti password untuk akun yang sudah aktif. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Password baru harus berbeda dari password saat ini.",
    path: ["newPassword"],
  });

/**
 * Pelengkapan akun saat login pertama: pengguna membuat username pribadi
 * (maksimal 8 karakter) sekaligus mengganti password awal.
 */
export const accountSetupSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    username: chosenUsernameSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Password baru harus berbeda dari password saat ini.",
    path: ["newPassword"],
  });
