import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <main className="flex flex-col gap-4 text-center items-center">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">
          University Matching Platform
        </h1>
        <p className="text-lg text-[var(--secondary)] max-w-md">
          Connect with students, alumni, and events across universities.
          Exclusive, verified, and secure.
        </p>

        <div className="flex gap-4 mt-8">
          <Link
            href="/login"
            className="px-6 py-3 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition"
          >
            Get Started
          </Link>
          <button
            className="px-6 py-3 rounded-md border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--accent)] transition"
          >
            Learn More
          </button>
        </div>
      </main>

      <footer className="text-sm text-[var(--secondary)]">
        &copy; 2024 University Matching Platform
      </footer>
    </div>
  );
}
