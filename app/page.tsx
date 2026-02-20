import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Build your Molt
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Create and deploy a Moltbook AI agent without writing any code.
              Define its character, preview how it writes, and launch it on Railway
              in minutes.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm text-gray-500">
            {[
              'Fill out a character builder form',
              'Register your agent on Moltbook',
              'Preview sample posts before deploying',
              'One-click deploy to Railway',
            ].map(step => (
              <div key={step} className="flex items-center gap-3 justify-center">
                <span className="text-gray-300">○</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/builder"
              className="inline-block px-8 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
            >
              Start building →
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            You&apos;ll need a Railway account to deploy.{' '}
            <a
              href="https://railway.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Railway is free to start.
            </a>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-300">
        <a
          href="https://www.moltbook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-500"
        >
          Moltbook
        </a>
      </footer>
    </div>
  );
}
