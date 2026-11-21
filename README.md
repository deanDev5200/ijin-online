# Ijin Online

A school dormitory permission-request system with a Bahasa Indonesia interface.
Students choose a permission type; each type has its own form fields, labels,
guide, and approval chain. Defaults follow _Formulir Ijin Asrama.pdf_ for six
types: Dispensasi Kegiatan Asrama, Kunjungan Keluarga, Izin Keluar Asrama, Izin
Penggunaan HP, Izin Pulang, and Titipan Siswa.

## Stack

- Next.js 16 (App Router, Node runtime)
- React 19 and TypeScript
- Tailwind CSS 4
- PostgreSQL 18 with Prisma 7
- Custom JWT sessions (`jose`) and hashed passwords (`bcryptjs`)

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 18 running on `localhost:5432`

On Windows, the PostgreSQL service can be started from an elevated shell:

```powershell
Start-Service postgresql-x64-18
```

## Database setup

The application expects a database named `ijin_online`. Create it once as a
PostgreSQL administrator:

```sql
CREATE DATABASE ijin_online;
```

For local development the `postgres` role is used. Production should use a
dedicated role that owns only this database. If that role will run
`prisma migrate dev`, it also needs the `CREATEDB` privilege for the shadow
database, or a separate shadow database must be configured.

## Environment

Copy `.env.example` to `.env`, then fill in the values:

```env
DATABASE_URL="postgresql://postgres:CHANGE_ME@localhost:5432/ijin_online?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="123456"
ADMIN_FULL_NAME="Administrator"
NEXT_PUBLIC_SCHOOL_NAME="Sekolah Asrama"
NEXT_PUBLIC_APP_NAME="Ijin Online"
SEED_DEMO="true"
```

Generate an `AUTH_SECRET` with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

URL-encode special characters in the database password, for example `@` becomes
`%40` and `:` becomes `%3A`. `.env` is gitignored and must not be committed.

## Install and run

```powershell
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

`db:deploy` applies the existing migrations. Use `db:migrate` when changing the
Prisma schema so a new migration is generated.

## Demo accounts

With `SEED_DEMO="true"`, the seed creates:

| Role           | Username  | Password |
| -------------- | --------- | -------- |
| Admin          | `admin`   | `123456` |
| Siswa          | `fauzi`   | `123456` |
| Siswa          | `lestar`  | `123456` |
| Pembina        | `wuland`  | `123456` |
| Staff Asrama   | `pratam`  | `123456` |
| Kepala Asrama  | `gunawa`  | `123456` |

All accounts use the initial password `123456` and must complete first-login
setup: create a personal username (minimum 6 characters) and password. The new
credentials are saved to the database and used for subsequent logins. Accounts
created before this rule were normalized by the
`20261121130000_reset_initial_credentials` migration; their existing usernames
remain valid until the forced setup replaces them.

## Scripts

| Script             | Description                                      |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Start the development server                     |
| `npm run build`    | Create a production build                        |
| `npm run start`    | Run the production build                         |
| `npm run lint`     | Run ESLint                                       |
| `npm run db:deploy`| Apply existing migrations                        |
| `npm run db:migrate`| Create and apply a migration during development |
| `npm run db:seed`  | Seed the admin and optional demo accounts        |
| `npm run db:studio`| Open Prisma Studio                               |

## Request workflow

Roles are `SISWA`, `PEMBINA`, `STAFF_ASRAMA`, `KEPALA_ASRAMA`, and `ADMIN`.

- A student creates a request for themselves and optionally other students.
  The visible fields, labels, and guide come from the selected permission type;
  the system only asks for data required by that type.
- Approvals are generated per type in the configured order. A PEMBINA approval
  belongs to the specific Pembina/Pendamping selected on the request. Other
  roles use a shared role queue where the first decision wins.
- The next request status is derived from the approval rows, so a type with two
  stages moves directly to `APPROVED` after its second approval.
- Rejection requires a note. Remaining approval steps are cancelled.
- A requester can cancel while the request is still pending.
- Every stage change creates notifications for the students, the mentor, and
  the next approvers, using labels captured on the approval rows.

## Admin pages

Administrators (`ADMIN`) manage the system through these pages:

| Page                     | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| Dashboard                | Summary of requests, accounts, and pending approvals          |
| Indeks Izin              | Search, filter, inspect, and export every request              |
| Kelola Akun              | Create, edit, import, deactivate, and reset account passwords |
| Pengaturan Perizinan     | Permission types, request rules, and selectable Pembina        |
| Notifikasi               | Account notifications                                         |

### Kelola Akun

- Student accounts require Nama Lengkap, NIS, Kelas, and Grha. Staff accounts
  require Nama Lengkap and NIP.
- The username is generated automatically from the last word of the full name:
  lowercase, no spaces, at most 6 characters. Collisions get a numeric suffix.
  The initial password for every account is `123456`, stored as a bcrypt hash.
- On first login, the user must create a personal username (minimum 6
  characters) and password. The setup page updates both values in the database;
  later logins use the new credentials.
- Identity data can be edited, passwords reset, and accounts deactivated or
  reactivated. Accounts are never deleted, so request history and approval
  trails remain intact. Deactivation and password resets end active sessions.
- Roles cannot be changed after an account is created.

### Excel import

Download the template from **Kelola Akun → Template Excel**, fill the
`Akun Siswa` sheet, then upload it under **Impor akun siswa dari Excel**. The
template also contains a `Petunjuk` sheet describing each column.

| Column       | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| Nama Lengkap | Required. Student full name, 3-100 characters.                       |
| NIS          | Required. Unique student number; keep the cell formatted as text.    |
| Grha         | Required. Dormitory/grha name, 2-50 characters. Import fails if this column is missing. |
| Kelas        | Required. Class name, up to 50 characters.                           |

Usernames and passwords are not imported: usernames are generated from the
full name and the initial password is `123456`. A workbook may contain at most
200 data rows. Existing NIS values are reported per row and skipped rather than
overwritten. After import, the result summary lists created accounts and every
rejected row with its reason.

### Indeks Izin

Search by student name, NIS, class, grha, purpose, or place, then filter by
status, permission type, and start/end date. Each row opens a detail page with
the full activity data and approval trail. **Ekspor Excel** downloads every
request matching the current filters, including a summary sheet with the
applied filters and exporter identity. Requests that exceed the configured
approval deadline are marked as overdue.

### Pengaturan Perizinan

- **Ketentuan pengajuan**: minimum lead days, maximum date-range length,
  maximum students per request, approval deadline, and default start/end times.
  These settings drive the student form and are re-validated on submit.
- **Jenis izin**: create, edit, and deactivate permission types. At least one
  type must stay active. Deactivated types remain on historical requests.
- **Konfigurasi per jenis izin**: for each type, set the ordered approval roles
  (up to three), the displayed/required form fields, custom field labels,
  custom approval labels, and the form guide shown to students. Changes apply
  to new requests; historical approval labels are kept on each request.
- **Alur persetujuan**: Pembina/Pendamping, Staff Asrama, and Kepala Asrama can
  be ordered or omitted per type. A PEMBINA stage goes to the mentor selected on
  the request; other stages use the relevant role and the first decision wins.
- **Pembina/Pendamping yang dapat dipilih**: only checked, active staff
  accounts appear as mentor choices on the student form.
