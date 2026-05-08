import { http, HttpResponse } from "msw";
import { loginSchema } from "@/lib/schemas";
import { users } from "@/mocks/db";
import { encodeToken, requireAuth } from "@/mocks/lib/auth";
import { errorResponse } from "@/mocks/lib/response";

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, "請填寫帳號與密碼");
    }
    const { username, password } = parsed.data;
    const user = users.find(
      (u) => u.username === username && u.password === password,
    );
    if (!user) return errorResponse(401, "帳號或密碼錯誤");
    return HttpResponse.json(
      {
        token: encodeToken(user.id, user.role),
        user: { id: user.id, username: user.username, role: user.role },
      },
      { status: 200 },
    );
  }),

  http.post("/api/auth/logout", () => HttpResponse.json({ ok: true })),

  http.get("/api/auth/me", ({ request }) => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return HttpResponse.json({
      id: auth.userId,
      username: auth.username,
      role: auth.role,
    });
  }),
];
