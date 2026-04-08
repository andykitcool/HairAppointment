import dotenv from 'dotenv'
dotenv.config()

function requireEnv(name: string): string {
  const value = String(process.env[name] || '').trim()
  if (!value) {
    throw new Error(`[config] Missing required environment variable: ${name}`)
  }
  return value
}

function getJwtSecret(): string {
  const secret = requireEnv('JWT_SECRET')
  const weakValues = new Set([
    'default_jwt_secret',
    'replace_with_a_strong_random_secret',
    'changeme',
    '123456',
    'password',
  ])

  if (secret.length < 16 || weakValues.has(secret.toLowerCase())) {
    throw new Error('[config] JWT_SECRET is too weak; use a strong random value with at least 16 characters')
  }

  return secret
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: getJwtSecret(),
  jwtExpireIn: '7d',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hair_appointment',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  wechat: {
    appid: process.env.WX_APPID || '',
    appsecret: process.env.WX_APPSECRET || ''
  }
}
