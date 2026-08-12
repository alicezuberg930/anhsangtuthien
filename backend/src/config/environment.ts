const requiredVariables = [
  'JWT_SECRET_KEY',
  'JWT_EXPIRED_IN',
  'MONGODB_URI',
] as const

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const missingVariables = requiredVariables.filter((variable) => {
    const value = environment[variable]
    return typeof value !== 'string' || value.trim().length === 0
  })

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`,
    )
  }

  return environment
}
