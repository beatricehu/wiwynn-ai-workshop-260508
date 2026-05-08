## 1. 專案初始化

- [x] 1.1 以 Vite 建立 React + TypeScript 專案於 repo 根目錄（保留現有 `src/skills/` 不動）
- [x] 1.2 安裝核心依賴：`react-router-dom`、`tailwindcss`、`react-hook-form`、`zod`、`@hookform/resolvers`、`recharts`
- [x] 1.3 安裝開發依賴：`msw`（含 `npx msw init public/ --save`）
- [x] 1.4 設定 TailwindCSS 與 PostCSS，於 `src/index.css` 加入 base/components/utilities
- [x] 1.5 初始化 shadcn/ui：`npx shadcn@latest init`，選擇 New York / Slate 風格
- [x] 1.6 透過 shadcn CLI 加入元件：`button`、`input`、`label`、`card`、`table`、`dialog`、`form`、`toast`（含 sonner）、`skeleton`、`dropdown-menu`、`chart`
- [ ] 1.7 從 Magic UI 取得需要的動效卡片元件（如 `magic-card` 用於 dashboard 卡片）並放入 `src/components/magicui/` — 延後（shadcn `Card` 已足以呈現 MVP）

## 2. MSW Mock 後端

- [x] 2.1 建立 `src/mocks/db.ts`：定義 in-memory `users`、`vehicles`、`employees` seed data（含 admin/user 兩組帳號、約 8–10 筆車輛、5 筆員工）；車輛的 `createdAt` 須分散於近 6 個月，使儀表板趨勢圖有資料
- [x] 2.2 建立共用工具 `src/mocks/lib/auth.ts`：實作 token 編解碼（格式 `mock-token-<userId>-<role>`）與 `requireAuth(req, role?)` helper，回傳 401/403 統一錯誤
- [x] 2.3 建立 `src/mocks/lib/response.ts`：統一錯誤回應 shape `{ message: string, field?: string }`，並提供 `errorResponse(status, message, field?)` helper
- [x] 2.4 建立 `src/mocks/handlers/auth.ts`：實作 `POST /api/auth/login`（成功回 `{ token, user }`、失敗回 401）、`POST /api/auth/logout`、`GET /api/auth/me`
- [x] 2.5 建立 `src/mocks/handlers/vehicles.ts`：實作 `GET/POST /api/vehicles`、`GET/PUT/DELETE /api/vehicles/:id`；body 驗證重用 `src/lib/schemas.ts` 的 `vehicleSchema`；`plateNo` 唯一性違反回 409（PUT 時排除自己）
- [x] 2.6 建立 `src/mocks/handlers/employees.ts`：實作員工 CRUD；所有 method 透過 `requireAuth(req, 'admin')` 守衛；body 驗證重用 `employeeSchema`；`email` 唯一性違反回 409
- [x] 2.7 建立 `src/mocks/handlers/dashboard.ts`：實作 `GET /api/dashboard/stats`，回應 `{ totals: { vehicles, availableVehicles, employees, addedThisMonth }, statusDistribution: [...], monthlyAdded: [...近6月，由舊到新] }`
- [x] 2.8 建立 `src/mocks/browser.ts`：彙整 handlers 並 export `worker`
- [x] 2.9 於 `src/main.tsx` 依 `import.meta.env.VITE_USE_MSW === 'true'` 啟動 worker（`onUnhandledRequest: 'bypass'`），於 React render 前 await 完成

## 3. 共用基礎建設

- [x] 3.1 建立 `src/lib/api.ts`：fetch 包裝函式（自動帶 token、統一錯誤處理）
- [x] 3.2 建立 `src/lib/auth-context.tsx`：`AuthProvider` + `useAuth` hook，管理 `user`、`token`、`login`、`logout`、`hydrate`
- [x] 3.3 建立 `src/lib/schemas.ts`：定義 `vehicleSchema`、`employeeSchema`、`loginSchema`（zod）
- [x] 3.4 建立 `src/components/route-guard.tsx`：`<ProtectedRoute>` 與 `<AdminRoute>`
- [x] 3.5 建立 `src/components/app-layout.tsx`：含 sidebar/topbar 導覽列、登出按鈕、依角色顯示員工管理連結
- [x] 3.6 設定 `src/router.tsx`：定義 `/login`、`/`、`/vehicles`、`/employees` 路由與守衛

## 4. 登入頁

- [x] 4.1 建立 `src/pages/login.tsx`：使用 shadcn `Card` + `Form` 組成登入表單
- [x] 4.2 串接 `useAuth().login()`，成功後 `navigate('/')`，失敗顯示錯誤訊息
- [x] 4.3 已登入使用者進入 `/login` 時自動導向 `/`

## 5. 儀表板頁

- [x] 5.1 建立 `src/pages/dashboard.tsx`，呼叫 `GET /api/dashboard/stats`
- [x] 5.2 上方四張 `Card`：總車輛數、可用車輛數、員工總數、本月新增車輛數
- [x] 5.3 下方圖表 1：車輛狀態分佈（Recharts 長條圖或圓餅圖）
- [x] 5.4 下方圖表 2：近 6 個月新增車輛數趨勢（Recharts 折線圖）
- [x] 5.5 載入中顯示 `Skeleton`、API 失敗顯示錯誤訊息與重試按鈕

## 6. 車輛管理頁

- [x] 6.1 建立 `src/pages/vehicles.tsx`，以 `Table` 呈現車輛列表
- [x] 6.2 「新增車輛」`Dialog` + `Form`，串接 `POST /api/vehicles`，處理車牌重複錯誤
- [x] 6.3 「編輯」`Dialog`（複用同一表單元件），串接 `PUT /api/vehicles/:id`
- [x] 6.4 「刪除」確認 `Dialog`（shadcn `AlertDialog`），串接 `DELETE /api/vehicles/:id`
- [x] 6.5 操作成功 / 失敗以 `toast` 提示
- [x] 6.6 空狀態：顯示「尚無車輛資料」與新增按鈕

## 7. 員工管理頁

- [x] 7.1 建立 `src/pages/employees.tsx`，路由以 `<AdminRoute>` 包裹
- [x] 7.2 以 `Table` 呈現員工列表
- [x] 7.3 「新增員工」`Dialog` + `Form`，串接 `POST /api/employees`，處理 email 重複錯誤
- [x] 7.4 「編輯」`Dialog`，串接 `PUT /api/employees/:id`
- [x] 7.5 「刪除」確認 `Dialog`，串接 `DELETE /api/employees/:id`
- [x] 7.6 後端回 403 時顯示「權限不足」toast（理論上經守衛後不會發生，作為防呆）

## 8. 整合測試與收尾

- [x] 8.1 手動走完核心流程：登入（admin/user）→ 儀表板 → 車輛 CRUD → 員工 CRUD → 登出
- [x] 8.2 驗證 `user` 角色無法看見也無法進入 `/employees`，且 user token 直接打 `/api/employees` 收到 403
- [x] 8.3 驗證重新整理後 session 仍維持，但業務資料（vehicles / employees）重置為 seed
- [x] 8.4 驗證 mock-api 邊界回應：未帶 token → 401、重複 plateNo / email → 409、刪除不存在 id → 404
- [x] 8.5 驗證 dashboard `monthlyAdded` 為長度 6 陣列、新增車輛後當月 count +1
- [x] 8.6 更新 `README.md`：啟動指令、預設帳號、MSW 注意事項（`VITE_USE_MSW`、資料不持久化）
- [x] 8.7 執行 `npm run lint` 與 `npm run build` 確認無錯誤
