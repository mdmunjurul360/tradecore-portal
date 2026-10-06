import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">TradeCore Portal</h1>
      <div className="flex gap-4">
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">
          Login
        </Link>
        <Link href="/register" className="px-4 py-2 bg-gray-200 text-black rounded">
          Register
        </Link>
      </div>
    </div>
  );
}
