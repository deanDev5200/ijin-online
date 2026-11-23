/** Password awal yang digunakan untuk setiap akun baru. */
export const INITIAL_PASSWORD = "123456";

/** Panjang maksimal username otomatis untuk akun siswa. */
export const GENERATED_USERNAME_MAX_LENGTH = 6;

/** Panjang maksimal username otomatis untuk akun tenaga pendidik. */
export const STAFF_GENERATED_USERNAME_MAX_LENGTH = 9;

const MIN_GENERATED_USERNAME_LENGTH = 3;

/** Awalan nama yang tidak dipakai sebagai unsur username pendidik. */
const NAME_PREFIXES_TO_SKIP = new Set(["i", "ni"]);

function nameParts(fullName: string): string[] {
  return fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function uniqueUsername(
  base: string,
  takenUsernames: Iterable<string>,
  maxLength: number,
): string {
  const taken = new Set(
    Array.from(takenUsernames, (username) => username.toLowerCase()),
  );

  const isAvailable = (candidate: string) => !taken.has(candidate);

  const claim = (candidate: string) => {
    taken.add(candidate);

    if (Array.isArray(takenUsernames)) {
      takenUsernames.push(candidate);
    }

    return candidate;
  };

  if (isAvailable(base)) {
    return claim(base);
  }

  const trySuffixes = (
    prefixLength: number,
    from: number,
    to: number,
  ): string | null => {
    const prefix = base.slice(0, prefixLength);

    for (let number = from; number <= to; number += 1) {
      const candidate = `${prefix}${number}`;

      if (
        candidate.length <= maxLength &&
        isAvailable(candidate)
      ) {
        return claim(candidate);
      }
    }

    return null;
  };

  for (
    let suffixDigits = 1;
    suffixDigits <= maxLength - MIN_GENERATED_USERNAME_LENGTH;
    suffixDigits += 1
  ) {
    const from = suffixDigits === 1 ? 1 : 10 ** (suffixDigits - 1);
    const to = 10 ** suffixDigits - 1;

    for (
      let prefixLength = Math.min(base.length, maxLength - suffixDigits);
      prefixLength >= MIN_GENERATED_USERNAME_LENGTH;
      prefixLength -= 1
    ) {
      const candidate = trySuffixes(prefixLength, from, to);
      if (candidate) return candidate;
    }
  }

  throw new Error("Tidak dapat membuat username unik dari nama tersebut.");
}

/**
 * Membuat username otomatis untuk siswa dari kata terakhir nama lengkap
 * (mis. "I Kadek Widya Ananta Kusuma" menjadi "kusuma"), maksimal 6 karakter.
 *
 * `takenUsernames` akan dimutasi dengan username baru agar pemanggilan
 * berikutnya dalam satu proses (mis. saat impor) tidak menghasilkan username
 * yang sama.
 */
export function generateUsername(
  fullName: string,
  takenUsernames: Iterable<string> = [],
): string {
  const parts = nameParts(fullName).reverse();
  let base = (parts[0] ?? "").slice(0, GENERATED_USERNAME_MAX_LENGTH);

  if (base.length < MIN_GENERATED_USERNAME_LENGTH) {
    base = base.padEnd(MIN_GENERATED_USERNAME_LENGTH, "0");
  }

  return uniqueUsername(base, takenUsernames, GENERATED_USERNAME_MAX_LENGTH);
}

/**
 * Membuat username otomatis untuk tenaga pendidik dari dua kata pertama nama,
 * tanpa awalan seperti "I" atau "Ni" (mis. "Gede Sucipta, S.Pd" menjadi
 * "gedesucip"). Maksimal 9 karakter; angka ditambahkan jika sudah dipakai.
 *
 * `takenUsernames` akan dimutasi dengan username baru agar pemanggilan
 * berikutnya dalam satu proses (mis. saat impor) tidak menghasilkan username
 * yang sama.
 */
export function generateStaffUsername(
  fullName: string,
  takenUsernames: Iterable<string> = [],
): string {
  const parts = nameParts(fullName);
  const meaningfulParts =
    parts[0] && NAME_PREFIXES_TO_SKIP.has(parts[0]) ? parts.slice(1) : parts;

  let base = meaningfulParts
    .slice(0, 2)
    .join("")
    .slice(0, STAFF_GENERATED_USERNAME_MAX_LENGTH);

  if (base.length < MIN_GENERATED_USERNAME_LENGTH) {
    base = base.padEnd(MIN_GENERATED_USERNAME_LENGTH, "0");
  }

  return uniqueUsername(
    base,
    takenUsernames,
    STAFF_GENERATED_USERNAME_MAX_LENGTH,
  );
}
