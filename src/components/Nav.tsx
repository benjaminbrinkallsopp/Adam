"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Nav() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Adam
            </Link>
            <Link href="/tree" className="text-gray-600 hover:text-gray-900">
              Stamtræ
            </Link>
            {session && (
              <Link href="/people" className="text-gray-600 hover:text-gray-900">
                Personer
              </Link>
            )}
          </div>
          <div>
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{session.user?.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Log ud
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Log ind
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
