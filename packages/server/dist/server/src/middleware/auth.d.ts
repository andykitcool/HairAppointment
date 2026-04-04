import type { IJwtPayload } from '../../../shared/src/types';
import type { Context, Next } from 'koa';
/**
 * 生成 JWT Token
 */
export declare function signJwt(payload: IJwtPayload): string;
/**
 * 验证 JWT Token
 */
export declare function verifyJwt(token: string): IJwtPayload | null;
/**
 * 小程序 JWT 认证中间件（支持用户和管理员）
 */
export declare function authMiddleware(ctx: Context, next: Next): Promise<void>;
/**
 * 要求店长或超管权限
 */
export declare function requireOwner(ctx: Context, next: Next): Promise<any> | undefined;
/**
 * COZE API Key 认证中间件
 */
export declare function cozeAuthMiddleware(ctx: Context, next: Next): Promise<void>;
//# sourceMappingURL=auth.d.ts.map