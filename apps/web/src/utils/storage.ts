export const SF_TOKEN_KEY = "SF_TOKEN";

export const readToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SF_TOKEN_KEY);
};

export const writeToken = (token: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SF_TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SF_TOKEN_KEY);
};
