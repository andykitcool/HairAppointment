import Router from 'koa-router'
import * as platformController from '../controllers/platform.js'

const router = new Router({ prefix: '/api/platform' })

// 平台公开接口
router.get('/ads', platformController.getPublicAds)
router.get('/coze-config', platformController.getPublicCozeConfig)
router.get('/hairstyle-recommend/latest', platformController.getLatestHairstyleRecommend)
router.post('/hairstyle-recommend', platformController.hairstyleRecommend)
router.get('/hairstyle-recommend/:taskId', platformController.getHairstyleRecommendTask)

export default router
