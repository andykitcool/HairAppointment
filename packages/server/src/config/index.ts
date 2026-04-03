import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
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
