import type { Metadata } from "next";
import {
  CalendarCheck2,
  GraduationCap,
  History,
  Route,
  ShieldCheck,
} from "lucide-react";

import { requireGuest } from "@/lib/auth/guards";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Sekolah Asrama";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Ijin Online";

const features = [
  {
    icon: CalendarCheck2,
    title: "Ajukan izin dengan mudah",
    description:
      "Buat dispensasi kegiatan asrama untuk satu atau beberapa siswa sekaligus.",
  },
  {
    icon: Route,
    title: "Alur persetujuan yang jelas",
    description:
      "Pantau keputusan Guru dan Staff Pegawai pada setiap jenis izin.",
  },
  {
    icon: History,
    title: "Riwayat tersimpan rapi",
    description:
      "Semua pengajuan dan keputusan tersimpan untuk kebutuhan administrasi.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  await requireGuest();

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const showDemo =
    process.env.SEED_DEMO === "true" && process.env.NODE_ENV !== "production";

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-blue-700 via-blue-800 to-blue-950 p-10 text-blue-50 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -right-28 bottom-0 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-blue-200 uppercase">
              {schoolName}
            </p>
            <p className="text-sm font-medium text-white">{appName}</p>
          </div>
        </div>

        <div className="relative max-w-xl space-y-8 py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
            <ShieldCheck className="size-3.5" />
            Sistem Perizinan Asrama Digital
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              Izin asrama jadi lebih tertata.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-blue-100/80">
              Ajukan dispensasi kegiatan, pantau persetujuan, dan simpan
              riwayat izin dalam satu tempat.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <feature.icon className="size-4 text-blue-100" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-blue-100/70">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-blue-200/60">
          © {new Date().getFullYear()} {schoolName}. Seluruh hak cipta
          dilindungi.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {schoolName}
              </p>
              <p className="text-sm font-semibold">{appName}</p>
            </div>
          </div>

          <div className="mb-8 space-y-2">
            <p className="text-sm font-medium text-primary">
              Masuk ke akun Anda
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Selamat datang kembali
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Gunakan username dan password yang Anda buat saat pertama kali
              masuk. Akun baru memakai password awal 123456 dan akan diminta
              membuat username serta password pribadi.
            </p>
          </div>

          <LoginForm next={next} showDemo={showDemo} />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Belum punya akun? Hubungi administrator asrama.
          </p>

          <p className="mt-8 text-center text-[11px] text-muted-foreground lg:hidden">
            © {new Date().getFullYear()} {schoolName}
          </p>
        </div>
      </main>
    </div>
  );
}
