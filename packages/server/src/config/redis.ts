import { Redis } from 'ioredis'
import { config } from './index.js'

let redis: Redis | null = null

export async function connectRedis() {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    retryStrategy: (times: number) => Math.min(times * 200, 5000)
  })

  redis.on('connect', () => console.log('✅ Redis connected'))
  redis.on('error', (err: Error) => console.error('❌ Redis error:', err))

  return redis
}

export function getRedis(): Redis {
  if (!redis) throw new Error('Redis not initialized')
  return redis
}
