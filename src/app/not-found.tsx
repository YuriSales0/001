import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#1e3a5f] mb-2">404</h1>
        <p className="text-gray-500 mb-6">Page not found</p>
        <Link
          href="/"
          className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg hover:bg-[#162d4a] inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
