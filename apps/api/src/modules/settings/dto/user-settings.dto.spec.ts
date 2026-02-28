import { UpdateUserSettingsSchema } from './user-settings.dto';

describe('UpdateUserSettingsSchema', () => {
  it('should pass with empty object', () => {
    expect(() => UpdateUserSettingsSchema.parse({})).not.toThrow();
  });

  it('should pass with only uiTheme', () => {
    const result = UpdateUserSettingsSchema.parse({ uiTheme: 'dark' });
    expect(result.uiTheme).toBe('dark');
  });

  it('should pass with only itemsPerPage: 10', () => {
    const result = UpdateUserSettingsSchema.parse({ itemsPerPage: 10 });
    expect(result.itemsPerPage).toBe(10);
  });

  it('should pass with only itemsPerPage: 100', () => {
    const result = UpdateUserSettingsSchema.parse({ itemsPerPage: 100 });
    expect(result.itemsPerPage).toBe(100);
  });

  it('should fail with itemsPerPage: 9 (below min)', () => {
    expect(() =>
      UpdateUserSettingsSchema.parse({ itemsPerPage: 9 }),
    ).toThrow();
  });

  it('should fail with itemsPerPage: 101 (above max)', () => {
    expect(() =>
      UpdateUserSettingsSchema.parse({ itemsPerPage: 101 }),
    ).toThrow();
  });

  it('should fail with itemsPerPage: 20.5 (not integer)', () => {
    expect(() =>
      UpdateUserSettingsSchema.parse({ itemsPerPage: 20.5 }),
    ).toThrow();
  });

  it('should fail with invalid uiTheme', () => {
    expect(() =>
      UpdateUserSettingsSchema.parse({ uiTheme: 'purple' }),
    ).toThrow();
  });

  it('should pass defaultSnippetVisibility: true', () => {
    const result = UpdateUserSettingsSchema.parse({
      defaultSnippetVisibility: true,
    });
    expect(result.defaultSnippetVisibility).toBe(true);
  });

  it('should pass defaultSnippetVisibility: false', () => {
    const result = UpdateUserSettingsSchema.parse({
      defaultSnippetVisibility: false,
    });
    expect(result.defaultSnippetVisibility).toBe(false);
  });

  it('should fail defaultSnippetVisibility: "true" (string)', () => {
    expect(() =>
      UpdateUserSettingsSchema.parse({ defaultSnippetVisibility: 'true' }),
    ).toThrow();
  });

  it('should transform defaultLanguage to lowercase and trimmed', () => {
    const result = UpdateUserSettingsSchema.parse({
      defaultLanguage: '  TypeScript  ',
    });
    expect(result.defaultLanguage).toBe('typescript');
  });

  it('should pass defaultLanguage: null (explicit null)', () => {
    const result = UpdateUserSettingsSchema.parse({ defaultLanguage: null });
    expect(result.defaultLanguage).toBeNull();
  });

  it('should fail defaultLanguage: "" (empty string)', () => {
    expect(() =>
      UpdateUserSettingsSchema.parse({ defaultLanguage: '' }),
    ).toThrow();
  });

  it('should fail defaultLanguage: 51-char string', () => {
    expect(() =>
      UpdateUserSettingsSchema.parse({ defaultLanguage: 'a'.repeat(51) }),
    ).toThrow();
  });
});
