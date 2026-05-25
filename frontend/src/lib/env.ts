function required(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}. Set it in frontend/.env`);
  }
  return value;
}

export const env = {
  VITE_API_URL: required('VITE_API_URL'),
} as const;
