import Router from 'koa-router'
import { authMiddleware } from '../middleware/auth.js'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const router = new Router({ prefix: '/api/upload' })

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * 上传图片
 * POST /api/upload/image
 */
router.post('/image', authMiddleware, async (ctx) => {
  try {
    const files = ctx.request.files
    if (!files || !files.file) {
      ctx.body = { code: 400, message: '请选择要上传的文件', data: null }
      return
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.mimetype || '')) {
      ctx.body = { code: 400, message: '只支持 JPG、PNG、GIF、WEBP 格式的图片', data: null }
      return
    }

    // 检查文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size && file.size > maxSize) {
      ctx.body = { code: 400, message: '图片大小不能超过 5MB', data: null }
      return
    }

    // 生成唯一文件名
    const ext = path.extname(file.originalFilename || '.jpg')
    const filename = `${crypto.randomUUID()}${ext}`
    const targetPath = path.join(uploadDir, filename)

    // 移动文件（使用 copy+unlink 支持跨文件系统）
    const sourcePath = file.filepath
    fs.copyFileSync(sourcePath, targetPath)
    fs.unlinkSync(sourcePath)

    // 返回文件访问 URL
    const fileUrl = `/uploads/${filename}`
    
    ctx.body = {
      code: 0,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: filename,
        size: file.size,
      },
    }
  } catch (err: any) {
    console.error('[Upload] Error:', err)
    ctx.body = { code: 500, message: err.message || '上传失败', data: null }
  }
})

export default router
