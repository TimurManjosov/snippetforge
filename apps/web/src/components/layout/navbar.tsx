'use client';

import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const isLoggedIn = user != null;

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          SnippetForge
        </Link>
        <div className="navbar-links">
          <Link href="/snippets" className="navbar-link">
            Snippets
          </Link>
          <Link href="/tags" className="navbar-link">
            Tags
          </Link>
          {isLoggedIn && (
            <>
              <Link href="/favorites" className="navbar-link">
                Favorites
              </Link>
              <Link href="/collections" className="navbar-link">
                Collections
              </Link>
            </>
          )}
        </div>
        <div className="navbar-auth">
          {isLoggedIn ? (
            <>
              <span className="navbar-username">{user.username}</span>
              <button
                type="button"
                className="navbar-logout-btn"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="navbar-link">
                Login
              </Link>
              <Link href="/register" className="navbar-link navbar-link--primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
