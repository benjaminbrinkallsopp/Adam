import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Adam</h1>
        <p className="text-xl text-gray-600 mb-8">
          Byg og udforsk dit stamtræ
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/tree"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
          >
            Se stamtræ
          </Link>
          <Link
            href="/login"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg text-lg hover:bg-gray-300"
          >
            Log ind for at redigere
          </Link>
        </div>
      </div>
    </div>
  );
}
