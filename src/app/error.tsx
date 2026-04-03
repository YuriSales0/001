"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error.message || "An unexpected error occurred"}</p>
        <button
          onClick={reset}
          className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg hover:bg-[#162d4a]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
