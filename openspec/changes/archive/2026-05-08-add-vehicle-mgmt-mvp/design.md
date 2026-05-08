## Context

本專案是一個全新前端應用（無既有後端），目標為快速產出可展示、可操作的車輛管理 MVP，供利害關係人試用並蒐集回饋。團隊熟悉 React 生態，UI 上希望採用 shadcn/ui + Magic UI 取得現代感與一致性；後端尚未就緒，因此採 MSW 在瀏覽器層攔截 fetch 請求，讓未來切換真實 API 時前端程式不需大改。

目前 repo 僅包含 `src/skills/`（與本系統無關的 echo skill 範例），等同於從零開始搭建前端。

## Goals / Non-Goals

**Goals:**

- 一個可登入、可看儀表板、可管理車輛、可（admin）管理員工的可操作 MVP
- 前後端介面以 REST 風格定義，未來能無痛將 MSW 換成真實 API
- 角色權限以前端路由守衛 + UI 條件渲染雙重控制
- 元件採用 shadcn/ui，UI 風格一致、開發速度快

**Non-Goals:**

- 真實使用者管理（密碼雜湊、JWT、refresh token、忘記密碼）
- 持久化（資料庫、localStorage 暫存業務資料）— 僅 auth session 持久化
- 國際化、無障礙完整支援（保持基礎可用即可）
- 單元測試以外的整合 / E2E 測試
- 部署、CI、效能優化（code splitting、SSR）

## Decisions

### D1. 前端框架與打包工具：React + Vite

選 **Vite** 而非 Next.js / CRA：MVP 僅需 SPA、無 SSR 需求；Vite 啟動快、設定簡單、與 MSW 整合順暢。

### D2. UI 元件庫：shadcn/ui + Magic UI

shadcn 採「複製到專案」策略，元件原始碼可直接編輯，無黑箱；Magic UI 補強動畫元件（卡片、圖表動效）。透過 `npx shadcn@latest add <component>` 引入。

### D3. 路由與權限：React Router v6 + 自製 `<ProtectedRoute>` / `<AdminRoute>`

- `<ProtectedRoute>`：檢查 session，未登入導向 `/login`
- `<AdminRoute>`：檢查角色，非 admin 導向 `/`
- 不引入 react-query / redux：MVP 狀態用 React Context（`AuthContext`）+ `useState`，避免過度設計

### D4. Mock 後端：MSW（browser worker）

- 開發模式啟動 `worker.start()`；生產模式可選擇打包入 bundle 供展示
- Handlers 定義於 `src/mocks/handlers/`，依 capability 分檔（`auth.ts`、`vehicles.ts`、`employees.ts`、`dashboard.ts`）
- Seed data 集中於 `src/mocks/db.ts`，以 in-memory 物件模擬資料表，支援 CRUD 操作
- 重新整理頁面 → 資料重置為 seed（MVP 範圍內可接受）

**API 契約（REST）：**

| Method | Path | 說明 | 權限 |
|---|---|---|---|
| POST | `/api/auth/login` | 登入，回傳 `{ token, user }` | 公開 |
| POST | `/api/auth/logout` | 登出 | 已登入 |
| GET | `/api/auth/me` | 取得當前使用者 | 已登入 |
| GET | `/api/dashboard/stats` | 取得卡片數據與圖表資料 | 已登入 |
| GET / POST | `/api/vehicles` | 列表 / 新增 | 已登入 |
| GET / PUT / DELETE | `/api/vehicles/:id` | 檢視 / 編輯 / 刪除 | 已登入 |
| GET / POST | `/api/employees` | 列表 / 新增 | admin |
| GET / PUT / DELETE | `/api/employees/:id` | 檢視 / 編輯 / 刪除 | admin |

### D5. 表單與驗證：react-hook-form + zod

每個資源（vehicle / employee）定義一份 zod schema，前端表單與 MSW handler 共用，確保契約一致。

### D6. 圖表：Recharts

開源、與 React 整合好、shadcn 有對應的 chart wrapper（`shadcn add chart`）。MVP 只需 1–2 種圖表（長條圖 / 折線圖）即可。

### D7. Session 持久化：localStorage

登入成功後將 `{ token, user }` 寫入 `localStorage`；App 啟動時讀回並寫入 `AuthContext`。Token 為 MSW 端產生的假字串（如 `mock-token-${userId}`），僅作存在性檢查。

### D8. Seed 帳號（明碼，僅 MVP 用）

- `admin / admin123` → role: `admin`
- `user / user123` → role: `user`

明碼合理化：MVP 無真實安全需求；未來導入真實後端時整段抽換。

## Risks / Trade-offs

- **MSW 在生產環境啟用** → Mitigation：以環境變數 `VITE_USE_MSW` 控制；展示用 build 開啟、未來真實 API 上線時關閉
- **資料不持久（重新整理即重置）** → Mitigation：MVP 預期行為，README 明確說明；若需求升級可改寫入 `localStorage`（一行程式碼）
- **明碼比對 / 假 token** → Mitigation：在 `auth.ts` handler 集中處理，未來換真實後端時只需替換該檔
- **shadcn 元件版本鎖定不足** → Mitigation：在 `package.json` 鎖定 shadcn CLI 版本與已加入元件清單，於 README 列出
- **Recharts bundle 體積偏大** → Mitigation：MVP 不在意；後續可改 lazy import

## Migration Plan

不適用（首次建置，無既有系統需遷移）。未來導入真實後端的步驟：

1. 移除 `src/mocks/` 與 `worker.start()` 呼叫
2. 將 `src/lib/api.ts` 的 base URL 改為真實後端
3. 將假 token 替換為真實 JWT 流程
4. 員工 / 車輛 schema 與後端對齊（zod schema 可能需微調）

## Open Questions

- 儀表板的「圖表」具體要呈現什麼？暫定為「車輛狀態分佈」（圓餅或長條）+「近 6 個月新增車輛趨勢」（折線），實作時可依 stakeholder 回饋調整
- 員工資料欄位範圍？暫定：`id, name, email, department, role, hireDate`
- 車輛資料欄位範圍？暫定：`id, plateNo, brand, model, year, status (available/in-use/maintenance), assignedTo`
