const requiredEnvVars = [
  { name: "DATABASE_URL", isUrl: true },
  { name: "NEXT_PUBLIC_SUPABASE_URL", isUrl: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", isUrl: false },
];

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar.name];
  if (!value || value.trim() === "") {
    console.error(`Invalid environment variables: ${envVar.name} is missing`);
    throw new Error(`Invalid environment variables`);
  }
  
  if (envVar.isUrl) {
    try {
      new URL(value);
    } catch (e) {
      console.error(`Invalid environment variables: ${envVar.name} must be a valid URL`);
      throw new Error(`Invalid environment variables`);
    }
  }
}

// Ensure USE_MOCK_DATA has a default if not set
if (!process.env.NEXT_PUBLIC_USE_MOCK_DATA) {
  process.env.NEXT_PUBLIC_USE_MOCK_DATA = "false";
}
