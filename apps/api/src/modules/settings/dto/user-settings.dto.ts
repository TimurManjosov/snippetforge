import { z } from 'zod';

export const UiThemeSchema = z.enum(['system', 'light', 'dark']);

export const UserSettingsSchema = z.object({
  defaultSnippetVisibility: z.boolean(),
  defaultLanguage: z
    .string()
    .min(1)
    .max(50)
    .transform((v) => v.trim().toLowerCase())
    .nullable()
    .optional(),
  uiTheme: UiThemeSchema,
  itemsPerPage: z.number().int().min(10).max(100),
});

export const UpdateUserSettingsSchema = UserSettingsSchema.partial();

export type UserSettingsDto = z.infer<typeof UserSettingsSchema>;
export type UpdateUserSettingsDto = z.infer<typeof UpdateUserSettingsSchema>;
