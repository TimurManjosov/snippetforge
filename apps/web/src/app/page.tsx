import Link from "next/link";

export default function Home() {
  return (
    <main className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">SnippetForge</h1>
        <p className="snippet-page-subtitle">
          Share clean code examples, discover community snippets, and organize your
          favorites and collections.
        </p>
      </div>

      <section className="snippet-form-card" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Get started</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link href="/snippets" className="snippet-submit" style={{ textDecoration: "none" }}>
            Explore snippets
          </Link>
          <Link href="/register" className="snippet-retry-btn" style={{ textDecoration: "none" }}>
            Create account
          </Link>
          <Link href="/login" className="snippet-retry-btn" style={{ textDecoration: "none" }}>
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
