import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Share &amp; Discover Code Snippets
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10 max-w-lg mx-auto leading-relaxed">
          SnippetForge is a platform for developers to store, share, and find
          reusable code snippets — with syntax highlighting, tags, collections,
          and comments.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/snippets"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            Browse Snippets
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 px-6 py-3 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Get Started — it&apos;s free
          </Link>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl w-full text-left">
        <div>
          <div className="text-2xl mb-2">{'</>'}</div>
          <h2 className="font-semibold mb-1">Syntax Highlighting</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            All popular languages supported with Prism.js rendering.
          </p>
        </div>
        <div>
          <div className="text-2xl mb-2">#</div>
          <h2 className="font-semibold mb-1">Tags &amp; Search</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Find snippets instantly by keyword, language, or tag.
          </p>
        </div>
        <div>
          <div className="text-2xl mb-2">☆</div>
          <h2 className="font-semibold mb-1">Collections &amp; Favorites</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Organize your work into curated collections and save others&apos; snippets.
          </p>
        </div>
      </div>
    </main>
  );
}
