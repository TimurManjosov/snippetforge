/** Supported UI theme options. `'system'` defers to the OS preference. */
export type UiTheme = 'system' | 'light' | 'dark';

/** Persisted user preferences returned by GET /settings/me. */
export type UserSettings = {
  defaultSnippetVisibility: boolean;
  defaultLanguage?: string | null;
  uiTheme?: UiTheme;
  itemsPerPage?: number;
};

/** Partial payload accepted by PUT /settings/me. */
export type UpdateUserSettings = Partial<UserSettings>;
