import { LoginSchema, RegisterSchema } from "@snippetforge/shared";
import type { z } from "zod";

export type FieldErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string>
>;

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type RegisterFormValues = z.infer<typeof RegisterSchema>;

export function validateLogin(values: LoginFormValues): FieldErrors<LoginFormValues> | null {
  const result = LoginSchema.safeParse(values);
  if (result.success) return null;
  return flattenErrors<LoginFormValues>(result.error);
}

export function validateRegister(values: RegisterFormValues): FieldErrors<RegisterFormValues> | null {
  const result = RegisterSchema.safeParse(values);
  if (result.success) return null;
  return flattenErrors<RegisterFormValues>(result.error);
}

function flattenErrors<T extends Record<string, unknown>>(
  error: z.ZodError,
): FieldErrors<T> {
  const fieldErrors: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof T;
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export function normalizeLoginPayload(values: LoginFormValues): LoginFormValues {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };
}

export function normalizeRegisterPayload(values: RegisterFormValues): RegisterFormValues {
  return {
    email: values.email.trim().toLowerCase(),
    username: values.username.trim(),
    password: values.password,
  };
}
