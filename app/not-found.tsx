import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">🛣️</div>
        <h2 className="text-gray-900 text-xl font-bold mb-2">Wrong Turn</h2>
        <p className="text-gray-500 text-sm mb-6">
          This road doesn't go anywhere. Let's get you back on Route 66.
        </p>
        <Link href="/" className="bg-amber-500 text-white font-bold py-3 px-8 rounded-xl text-sm inline-block">
          Back to Route 66
        </Link>
      </div>
    </div>
  );
}
