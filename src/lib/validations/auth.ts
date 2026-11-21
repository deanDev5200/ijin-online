import { z } from "zod";

/**
 * Username yang dipakai saat masuk. Akun baru mendapat username otomatis
 * (3-6 karakter) dari sistem, sedangkan username buatan pengguna tepat
 * 6 karakter setelah proses pelengkapan akun pertama kali.
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
  .min(6, "Username minimal 6 karakter.")
  .max(6, "Username maksimal 6 karakter.")
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
 * (tepat 6 karakter) sekaligus mengganti password awal.
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
