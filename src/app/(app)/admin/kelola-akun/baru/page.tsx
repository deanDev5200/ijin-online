import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";

import { AccountCreateForm } from "./account-create-form";

export const metadata: Metadata = {
  title: "Tambah Akun",
};

export default async function CreateAccountPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Akun"
        description="Buat akun baru untuk siswa atau tenaga kependidikan asrama. Password awal wajib diganti saat login pertama."
      >
        <Button variant="outline" asChild>
          <Link href="/admin/kelola-akun">
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <AccountCreateForm />
    </div>
  );
}
