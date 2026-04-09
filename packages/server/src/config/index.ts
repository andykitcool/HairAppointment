import dotenv from 'dotenv'
dotenv.config()

const PLACEHOLDER_VALUES = new Set([
  'default_jwt_secret',
  'replace_with_a_strong_random_secret',
  'changeme',
  '123456',
  'password',
  'your_wechat_appid',
  'your_wechat_appsecret',
])

function requireEnv(name: string): string {
  const value = String(process.env[name] || '').trim()
  if (!value) {
    throw new Error(`[config] Missing required environment variable: ${name}`)
  }
  return value
}

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return PLACEHOLDER_VALUES.has(normalized) || normalized.startsWith('your_')
}

function getJwtSecret(): string {
  const secret = requireEnv('JWT_SECRET')

  if (secret.length < 16 || isPlaceholderValue(secret)) {
    throw new Error('[config] JWT_SECRET is too weak; use a strong random value with at least 16 characters')
  }

  return secret
}

function getWechatEnv(name: 'WX_APPID' | 'WX_APPSECRET'): string {
  const value = String(process.env[name] || '').trim()

  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[config] Missing required environment variable in production: ${name}`)
    }
    return ''
  }

  if (isPlaceholderValue(value)) {
    throw new Error(`[config] ${name} is still using a placeholder value`)
  }

  return value
}

function getCorsAllowedOrigins(): string[] {
  const raw = String(process.env.CORS_ALLOWED_ORIGINS || '').trim()
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      return []
    }
    return ['http://localhost:5173', 'http://localhost:5174']
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: getJwtSecret(),
  jwtExpireIn: '7d',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hair_appointment',
  corsAllowedOrigins: getCorsAllowedOrigins(),
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  wechat: {
    appid: getWechatEnv('WX_APPID'),
    appsecret: getWechatEnv('WX_APPSECRET')
  }
}
