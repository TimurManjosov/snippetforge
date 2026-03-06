import { z } from 'zod';

/**
 * Client-side Zod schemas for user settings.
 * These mirror the backend validation contract from Commit 26 (Settings CRUD).
 */

export const UiThemeSchema = z.enum(['system', 'light', 'dark']);

export const UpdateSettingsSchema = z.object({
  defaultSnippetVisibility: z.boolean().optional(),
  defaultLanguage: z
    .string()
    .trim()
    .toLowerCase()
    .max(50, 'Language must be at most 50 characters')
    .nullable()
    .optional(),
  uiTheme: UiThemeSchema.optional(),
  itemsPerPage: z.coerce
    .number()
    .int('Items per page must be a whole number')
    .min(10, 'Minimum is 10')
    .max(100, 'Maximum is 100')
    .optional(),
});
