"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  type FieldErrors,
  type LoginFormValues,
  normalizeLoginPayload,
  validateLogin,
} from "@/utils/validation";

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof LoginFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues((prev: LoginFormValues) => ({ ...prev, [field]: e.target.value }));
        setFieldErrors((prev: FieldErrors<LoginFormValues>) => {
          if (!prev[field]) return prev;
          const next = { ...prev };
          delete next[field];
          return next;
        });
      },
    [],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setFormError(null);

      const errors = validateLogin(values);
      if (errors) {
        setFieldErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        await login(normalizeLoginPayload(values));
        router.push("/snippets");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Login failed. Please try again.";
        setFormError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, login, router],
  );

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {formError && (
          <div role="alert" className="auth-form-error">
            {formError}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="login-email" className="auth-label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange("email")}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            className="auth-input"
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="auth-field-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="login-password" className="auth-label">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange("password")}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? "login-password-error" : undefined
            }
            className="auth-input"
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <p id="login-password-error" className="auth-field-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-submit"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="auth-link">
          Create one
        </Link>
      </p>
    </div>
  );
}
