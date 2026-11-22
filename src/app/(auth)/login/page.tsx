import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  CalendarCheck2,
  History,
  Route,
  ShieldCheck,
} from "lucide-react";

import { EdispenLogo } from "@/components/edispen-logo";
import { requireGuest } from "@/lib/auth/guards";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

const loginFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Sekolah Asrama";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "E-Dispen";

const features = [
  {
    icon: CalendarCheck2,
    title: "Ajukan izin dengan mudah",
    description:
      "Buat dispensasi kegiatan sekolah maupun asrama untuk satu atau beberapa siswa sekaligus.",
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
    <div
      className={`${loginFont.className} grid min-h-screen bg-background antialiased lg:h-screen lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden`}
    >
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-[#0b2f8f] via-[#1d4ed8] to-[#4338ca] p-7 text-blue-50 lg:flex lg:flex-col lg:justify-between xl:px-12 xl:py-8">
        <div className="pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full bg-sky-300/30 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 size-[30rem] rounded-full bg-indigo-300/25 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.16),transparent_45%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:56px_56px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-16 -right-24 size-[26rem] rotate-12 rounded-[3rem] border border-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-16 bottom-24 size-64 rounded-full border border-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-28 bottom-36 size-40 rounded-full border border-white/10"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <EdispenLogo className="size-10 shrink-0 shadow-lg shadow-blue-950/20 ring-1 ring-white/25" />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-blue-200 uppercase">
              PORTAL PERIZINAN
            </p>
            <p className="text-sm font-medium text-white">{appName}</p>
          </div>
        </div>

        <div className="relative max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-xs font-medium text-blue-50 shadow-lg shadow-blue-950/10 backdrop-blur-xl">
            <ShieldCheck className="size-3.5" />
            Sistem Perizinan &amp; Dispensasi Digital
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-white xl:text-4xl">
              Proses dispensasi lebih cepat, transparan, dan rapi.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-blue-100/80">
              Ajukan dispensasi kegiatan, pantau persetujuan, dan simpan riwayat
              izin dalam satu tempat.
            </p>
          </div>

          <ul className="space-y-2.5">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="flex gap-3 rounded-xl border border-white/15 bg-white/10 p-2.5 shadow-lg shadow-blue-950/10 backdrop-blur-xl transition-colors duration-200 hover:bg-white/15"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <feature.icon className="size-4 text-blue-50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-blue-100/75">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="invisible relative text-xs text-blue-200/70" aria-hidden="true">
          &nbsp;
        </p>
      </aside>

      <main className="relative flex items-center justify-center overflow-hidden bg-linear-to-br from-slate-100 via-blue-50/70 to-indigo-100/50 px-5 py-8 sm:px-8 lg:py-4">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(59,130,246,0.22)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -top-28 -right-24 size-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/4 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-linear-to-br from-white/85 via-sky-100/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-white/70 via-white/20 to-transparent" />
        <div className="relative w-full max-w-md">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <EdispenLogo className="size-10 shrink-0 shadow-md shadow-blue-600/25" />
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {schoolName}
              </p>
              <p className="text-sm font-semibold">{appName}</p>
            </div>
          </div>

          <div className="mb-5 space-y-2">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              PORTAL AKSES
            </p>
            <h2 className="text-2xl leading-tight font-semibold tracking-tight">
              Selamat datang kembali
            </h2>
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              Masuk menggunakan akun pribadi Anda untuk mengajukan dispensasi
              dan memantau status perizinan.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl shadow-blue-950/10 backdrop-blur-sm sm:p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-blue-500/20 via-sky-200/10 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
            <LoginForm next={next} showDemo={showDemo} />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Belum punya akun? Hubungi administrator sekolah atau asrama.
          </p>

          <p className="mt-5 text-center text-[11px] text-slate-500/80 lg:hidden">
            © {new Date().getFullYear()} {appName} · Dikembangkan oleh Dhika Sumarta
          </p>
        </div>

        <p className="absolute inset-x-0 bottom-12 hidden text-center text-[11px] text-slate-500/80 lg:block">
          © {new Date().getFullYear()} {appName} · Dikembangkan oleh Dhika Sumarta
        </p>
      </main>
    </div>
  );
}
