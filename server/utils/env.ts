// Comma-separated env lists (EXCLUDE_REPOS, EXCLUDE_ORGS). GitHub names are
// case-insensitive, so they are compared in lower case everywhere.
export function listFromEnv(value: string | undefined): string[] {
  return value?.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) ?? []
}

// `Number(process.env.X ?? fallback)` only reaches the fallback when the var is
// absent. A var that is present but blank, which is what .env.example hands you,
// parses to 0, and PR_COUNT=0 renders an empty wall with no error anywhere.
export function positiveIntFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value?.trim())
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}
