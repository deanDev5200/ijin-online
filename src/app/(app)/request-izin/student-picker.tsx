"use client";

import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";

import { Input } from "@/components/ui/input";

export type SelectableStudent = {
  id: string;
  fullName: string;
  nis: string | null;
  kelas: string | null;
  grha: string | null;
};

export function StudentPicker({
  students,
  requesterId,
  initialSelectedIds = [],
  maxStudents,
}: {
  students: SelectableStudent[];
  requesterId: string;
  initialSelectedIds?: string[];
  maxStudents: number;
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialSelectedIds
      .filter((id) => id !== requesterId)
      .slice(0, Math.max(0, maxStudents)),
  );

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return students;
    }

    return students.filter((student) =>
      [student.fullName, student.nis, student.kelas, student.grha].some(
        (value) => value?.toLowerCase().includes(term),
      ),
    );
  }, [students, query]);

  function toggleStudent(studentId: string) {
    setSelectedIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }

      if (current.length >= maxStudents) {
        return current;
      }

      return [...current, studentId];
    });
  }

  const atLimit = selectedIds.length >= maxStudents;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="student-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama, NIS, kelas, atau grha"
          aria-label="Cari siswa lain"
          className="h-10 pl-9"
        />
      </div>

      {students.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Belum ada siswa lain yang dapat ditambahkan.
        </p>
      ) : (
        <>
          <div className="max-h-72 divide-y overflow-y-auto rounded-xl border">
            {filteredStudents.map((student) => {
              const meta = [student.nis, student.kelas, student.grha]
                .filter(Boolean)
                .join(" · ");

              return (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    name="studentIds"
                    value={student.id}
                    checked={selectedIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    disabled={atLimit && !selectedIds.includes(student.id)}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {student.fullName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {meta || "Data akademik belum lengkap"}
                    </span>
                  </span>
                </label>
              );
            })}

            {filteredStudents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Tidak ada siswa yang cocok dengan pencarian.
              </p>
            ) : null}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UsersRound className="size-3.5" />
            {selectedIds.length} dari {maxStudents} siswa lain dipilih. Anda
            selalu tercantum sebagai pengaju.
          </p>
          {atLimit ? (
            <p className="text-xs text-muted-foreground">
              Batas jumlah siswa tercapai. Lepaskan pilihan lain untuk
              menambahkan siswa berbeda.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
