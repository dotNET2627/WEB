import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">DENTAL MANAGEMENT</p>
        <h1 className="mt-2 text-2xl font-bold">Đăng nhập hệ thống</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Chức năng xác thực sẽ được kết nối với ASP.NET Core API sau khi JWT hoặc cookie HTTP-only được cấu hình.
        </p>

        <form className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2" type="email" placeholder="email@clinic.vn" disabled />
          </label>
          <label className="block text-sm font-medium">
            Mật khẩu
            <input className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2" type="password" disabled />
          </label>
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white opacity-60" type="button" disabled>
            Đăng nhập
          </button>
        </form>

        <Link className="mt-6 block text-center text-sm text-blue-600" href="/dashboard">
          Xem dashboard mẫu
        </Link>
      </section>
    </main>
  );
}
