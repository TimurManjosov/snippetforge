"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  type FieldErrors,
  type RegisterFormValues,
  normalizeRegisterPayload,
  validateRegister,
} from "@/utils/validation";

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<RegisterFormValues>({
    email: "",
    username: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof RegisterFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues((prev: RegisterFormValues) => ({ ...prev, [field]: e.target.value }));
        setFieldErrors((prev: FieldErrors<RegisterFormValues>) => {
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

      const errors = validateRegister(values);
      if (errors) {
        setFieldErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        await register(normalizeRegisterPayload(values));
        router.push("/snippets");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.";
        setFormError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, register, router],
  );

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Get started with SnippetForge</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {formError && (
          <div role="alert" className="auth-form-error">
            {formError}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="register-email" className="auth-label">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange("email")}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
            className="auth-input"
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p id="register-email-error" className="auth-field-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-username" className="auth-label">
            Username
          </label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            value={values.username}
            onChange={handleChange("username")}
            aria-invalid={!!fieldErrors.username}
            aria-describedby={
              fieldErrors.username ? "register-username-error" : undefined
            }
            className="auth-input"
            placeholder="johndoe"
          />
          {fieldErrors.username && (
            <p id="register-username-error" className="auth-field-error" role="alert">
              {fieldErrors.username}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-password" className="auth-label">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange("password")}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? "register-password-error" : undefined
            }
            className="auth-input"
            placeholder="At least 8 characters"
          />
          {fieldErrors.password && (
            <p id="register-password-error" className="auth-field-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-submit"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <Link href="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
