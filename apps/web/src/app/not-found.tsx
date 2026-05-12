import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-6xl mb-4">🏏</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link href="/" className="mt-4 inline-block text-brand underline">
        Back to home
      </Link>
    </div>
  );
}
