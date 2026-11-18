# Ijin Online

A school dormitory permission-request system with a Bahasa Indonesia interface.
Students submit _Dispensasi Kegiatan Asrama_ requests, which are approved in
sequence by the selected Pembina/Pendamping, Staff Asrama, and Kepala Asrama.

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
ADMIN_PASSWORD="Admin12345"
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

| Role           | Username    | Password     |
| -------------- | ----------- | ------------ |
| Admin          | `admin`     | `Admin12345` |
| Siswa          | `siswa01`   | `demo123`    |
| Siswa          | `siswa02`   | `demo123`    |
| Pembina        | `pembina01` | `demo123`    |
| Staff Asrama   | `staff01`   | `demo123`    |
| Kepala Asrama  | `kepala01`  | `demo123`    |

The admin account is required to change its password on first login. The demo
accounts are not.

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

- A student creates a request for themselves and optionally other students,
  with a purpose, place, one date or a date range, times, and a selected
  Pembina/Pendamping.
- Approval stage 1 belongs to that specific Pembina. Stages 2 and 3 can be
  decided by any active user with the relevant role; the first decision wins.
- Rejection requires a note. Remaining approval steps are cancelled.
- A requester can cancel while the request is still pending.
- Every stage change creates notifications for the students, the mentor, and
  the next approvers.

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
  require Nama Lengkap and NIP. All accounts need a username and password.
- Usernames are 5-20 characters and accept letters, numbers, dots, and
  underscores. Passwords are stored as bcrypt hashes.
- Identity data can be edited, passwords reset, and accounts deactivated or
  reactivated. Accounts are never deleted, so request history and approval
  trails remain intact. Deactivation and password resets end active sessions.
- Roles cannot be changed after an account is created.
- Newly created and imported accounts must change their password on first
  login.

### Excel import

Download the template from **Kelola Akun → Template Excel**, fill the
`Akun Siswa` sheet, then upload it under **Impor akun siswa dari Excel**. The
template also contains a `Petunjuk` sheet describing each column.

| Column       | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| Nama Lengkap | Required. Student full name, 3-100 characters.                       |
| Username     | Required. 5-20 characters; lowercase letters, numbers, `.` and `_`.  |
| NIS          | Required. Unique student number; keep the cell formatted as text.    |
| Grha         | Required. Dormitory/grha name, 2-50 characters.                      |
| Kelas        | Required. Class name, up to 50 characters.                           |
| Password     | Required. Initial password, 6-72 characters.                         |

A workbook may contain at most 200 data rows. Existing usernames and NIS values
are reported per row and skipped rather than overwritten. After import, the
result summary lists created accounts and every rejected row with its reason.

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
- **Alur persetujuan**: fixed as Pembina/Pendamping → Staff Asrama → Kepala
  Asrama. Stage 1 goes to the mentor selected on the request; later stages use
  the relevant role and the first decision wins.
- **Pembina/Pendamping yang dapat dipilih**: only checked, active staff
  accounts appear as mentor choices on the student form.
