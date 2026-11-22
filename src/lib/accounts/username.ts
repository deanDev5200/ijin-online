/** Password awal yang digunakan untuk setiap akun baru. */
export const INITIAL_PASSWORD = "123456";

/** Panjang maksimal username yang dibuat otomatis oleh sistem. */
export const GENERATED_USERNAME_MAX_LENGTH = 6;

const MIN_GENERATED_USERNAME_LENGTH = 3;

/**
 * Membuat username unik dari nama lengkap.
 *
 * Kata terakhir nama diambil lebih dulu (mis. "I Kadek Widya Ananta Kusuma"
 * menjadi "kusuma"), diubah menjadi huruf kecil tanpa spasi, lalu dibatasi
 * maksimal 6 karakter. Jika kata terakhir terlalu pendek, angka ditambahkan
 * agar tetap memenuhi panjang minimum login. Jika username sudah dipakai,
 * angka unik ditambahkan di belakang dengan tetap menjaga panjang maksimal
 * 6 karakter.
 *
 * `takenUsernames` akan dimutasi dengan username baru agar pemanggilan
 * berikutnya dalam satu proses (mis. saat impor) tidak menghasilkan username
 * yang sama.
 */
export function generateUsername(
  fullName: string,
  takenUsernames: Iterable<string> = [],
): string {
  const taken = new Set(
    Array.from(takenUsernames, (username) => username.toLowerCase()),
  );

  const nameParts = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .reverse();

  // Hanya kata paling belakang yang dipakai, bukan kata depan nama.
  let base = (nameParts[0] ?? "").slice(0, GENERATED_USERNAME_MAX_LENGTH);

  if (base.length < MIN_GENERATED_USERNAME_LENGTH) {
    base = base.padEnd(MIN_GENERATED_USERNAME_LENGTH, "0");
  }

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

  const trySuffixes = (prefixLength: number, from: number, to: number) => {
    const prefix = base.slice(0, prefixLength);

    for (let number = from; number <= to; number += 1) {
      const candidate = `${prefix}${number}`;

      if (
        candidate.length <= GENERATED_USERNAME_MAX_LENGTH &&
        isAvailable(candidate)
      ) {
        return claim(candidate);
      }
    }

    return null;
  };

  for (let length = Math.min(base.length, 5); length >= 3; length -= 1) {
    const candidate = trySuffixes(length, 1, 9);
    if (candidate) return candidate;
  }

  for (let length = Math.min(base.length, 4); length >= 3; length -= 1) {
    const candidate = trySuffixes(length, 10, 99);
    if (candidate) return candidate;
  }

  const finalCandidate = trySuffixes(3, 100, 999);
  if (finalCandidate) return finalCandidate;

  throw new Error("Tidak dapat membuat username unik dari nama tersebut.");
}
