import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function FotLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-crystal-soft">
      {session?.user && (
        <header className="border-b border-crystal bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-6">
              <Link href="/fot/dashboard" className="font-semibold text-mahogany">
                B2C Portal — FOT
              </Link>
              <Link href="/fot/dashboard" className="text-sm text-mahogany/70 hover:text-ignite">
                Products
              </Link>
              <Link href="/fot/submissions" className="text-sm text-mahogany/70 hover:text-ignite">
                Submissions
              </Link>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/fot/login" });
              }}
            >
              <button className="text-sm text-mahogany/70 hover:text-ignite">Sign out</button>
            </form>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
