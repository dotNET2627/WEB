import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 md:px-6">
      <div>
        <p className="text-sm font-medium">Phòng khám nha khoa</p>
        <p className="text-xs text-[var(--muted)]">Workspace mặc định</p>
      </div>
      <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" href="/login">
        Đăng xuất
      </Link>
    </header>
  );
}
