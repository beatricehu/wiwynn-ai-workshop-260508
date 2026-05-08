import type { UserRole } from "@/lib/schemas";
import { users } from "@/mocks/db";
import { errorResponse } from "@/mocks/lib/response";

const TOKEN_PREFIX = "mock-token-";
const VALID_ROLES: UserRole[] = ["admin", "user"];

export function encodeToken(userId: string, role: UserRole): string {
  return `${TOKEN_PREFIX}${userId}-${role}`;
}

export function decodeToken(
  token: string,
): { userId: string; role: UserRole } | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const rest = token.slice(TOKEN_PREFIX.length);
  // 由結尾依序匹配 role，避免 userId 含 '-' 時拆解錯誤
  for (const role of VALID_ROLES) {
    const suffix = `-${role}`;
    if (rest.endsWith(suffix)) {
      const userId = rest.slice(0, -suffix.length);
      if (userId.length === 0) return null;
      return { userId, role };
    }
  }
  return null;
}

export function extractToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export type AuthInfo = {
  userId: string;
  role: UserRole;
  username: string;
};

/**
 * 驗證 request 是否帶有合法 token，並（可選）檢查角色。
 * 通過 → 回傳 AuthInfo；失敗 → 回傳 HttpResponse（401 / 403）。
 */
export function requireAuth(
  request: Request,
  requiredRole?: UserRole,
): AuthInfo | Response {
  const token = extractToken(request);
  if (!token) return errorResponse(401, "未登入");

  const decoded = decodeToken(token);
  if (!decoded) return errorResponse(401, "未登入");

  const user = users.find((u) => u.id === decoded.userId && u.role === decoded.role);
  if (!user) return errorResponse(401, "未登入");

  if (requiredRole && user.role !== requiredRole) {
    return errorResponse(403, "權限不足");
  }

  return { userId: user.id, role: user.role, username: user.username };
}
