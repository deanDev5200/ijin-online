import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(5, "Username minimal 5 karakter.")
  .max(20, "Username maksimal 20 karakter.")
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
