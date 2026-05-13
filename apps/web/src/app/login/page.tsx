import { Suspense } from "react";

import LoginForm from "@/components/login-form";

/**
 * The login form reads `?next=` via `useSearchParams`, which forces a
 * client-side render and must be wrapped in a Suspense boundary so the
 * page can still be statically prerendered (Next.js App Router requires
 * the bailout to be opt-in per subtree). A minimal fallback keeps the
 * frame stable while the form hydrates.
 */
export default function LoginPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-card" aria-busy="true" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
