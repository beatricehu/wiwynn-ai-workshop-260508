## ADDED Requirements

### Requirement: MSW Worker 啟動控制

系統 SHALL 在 `src/main.tsx` 中依環境變數 `VITE_USE_MSW` 決定是否啟動 MSW worker。當 `VITE_USE_MSW === 'true'` 時，SHALL 在 React 渲染前 `await worker.start({ onUnhandledRequest: 'bypass' })`，並於 console 輸出啟動訊息；否則 SHALL 不載入 MSW 相關程式碼。

#### Scenario: 開發模式啟用 MSW

- **WHEN** `.env.development` 設定 `VITE_USE_MSW=true` 並執行 `npm run dev`
- **THEN** 系統 SHALL 在頁面載入前完成 worker 啟動，所有 `/api/*` 請求由 MSW 攔截

#### Scenario: 生產模式關閉 MSW

- **WHEN** 建置時 `VITE_USE_MSW` 未設定或為 `false`
- **THEN** 系統 SHALL 不啟動 worker，`/api/*` 請求 SHALL 直接打到實際 base URL

#### Scenario: 未被攔截的請求

- **WHEN** 前端發出未在 handlers 中定義的 `/api/*` 路徑
- **THEN** MSW SHALL 採 `bypass` 策略放行，並於 console 顯示警告訊息以利偵錯

### Requirement: In-Memory Seed Data

系統 SHALL 於 `src/mocks/db.ts` 集中維護 in-memory 資料表 `users`、`vehicles`、`employees`。模組首次載入時 SHALL 以預設 seed 初始化；資料變更（CRUD）僅作用於記憶體，重新整理頁面後 SHALL 重新由 seed 還原。

**Seed 內容：**

- `users`：兩筆固定帳號 — `{ username: 'admin', password: 'admin123', role: 'admin' }` 與 `{ username: 'user', password: 'user123', role: 'user' }`
- `vehicles`：8–10 筆，涵蓋 `available` / `in-use` / `maintenance` 三種 `status`，`createdAt` 分散於最近 6 個月，以確保儀表板趨勢圖有資料
- `employees`：5 筆，欄位含 `id`、`name`、`email`、`department`、`role`、`hireDate`

#### Scenario: Worker 啟動後資料可立即查詢

- **WHEN** 前端在 worker 啟動後呼叫 `GET /api/vehicles`
- **THEN** 系統 SHALL 回傳 seed 中的 8–10 筆車輛資料

#### Scenario: 重新整理後資料重置

- **WHEN** 使用者新增 / 編輯 / 刪除任何資料後重新整理瀏覽器
- **THEN** 系統 SHALL 將 `vehicles` / `employees` 還原為 seed 狀態（此為 MVP 預期行為）

### Requirement: 認證與 Token 驗證

`POST /api/auth/login` SHALL 比對 `users` 中的明碼帳密：

- 比對成功 SHALL 回應 `200` 與 `{ token: 'mock-token-<userId>-<role>', user: { id, username, role } }`
- 比對失敗 SHALL 回應 `401` 與 `{ message: '帳號或密碼錯誤' }`

所有受保護端點 SHALL 檢查 `Authorization: Bearer <token>` header：

- 未提供或格式錯誤 SHALL 回應 `401` 與 `{ message: '未登入' }`
- token 不符合 `mock-token-<userId>-<role>` 格式 SHALL 回應 `401`
- 角色不符合該端點要求 SHALL 回應 `403` 與 `{ message: '權限不足' }`

`POST /api/auth/logout` SHALL 永遠回應 `200`（MSW 端不維護 session 黑名單）；`GET /api/auth/me` SHALL 依 token 解析回傳對應 user 物件。

#### Scenario: admin 登入取得 token

- **WHEN** 收到 `POST /api/auth/login` 帶 `{ username: 'admin', password: 'admin123' }`
- **THEN** MSW SHALL 回應 `200`，token 包含 `admin` 角色標記，user.role 為 `admin`

#### Scenario: 錯誤密碼

- **WHEN** 收到 `POST /api/auth/login` 帶錯誤密碼
- **THEN** MSW SHALL 回應 `401`，不洩露「帳號存在但密碼錯誤」之類細節

#### Scenario: 缺少 Authorization header

- **WHEN** 收到 `GET /api/vehicles` 但未帶 `Authorization` header
- **THEN** MSW SHALL 回應 `401 { message: '未登入' }`

#### Scenario: 非 admin 存取員工端點

- **WHEN** 收到 `GET /api/employees` 帶有 `user` 角色 token
- **THEN** MSW SHALL 回應 `403 { message: '權限不足' }`

### Requirement: 車輛 CRUD 與唯一性檢查

`/api/vehicles` 端點 SHALL 對所有已登入角色（admin / user）開放，並依下列規則處理請求：

- `GET /api/vehicles` SHALL 回應目前 `vehicles` 全集，依 `createdAt` 由新到舊排序
- `POST /api/vehicles` SHALL 驗證 body 符合 `vehicleSchema`（zod），通過後產生 `id`（uuid）、寫入 `createdAt = now()`，加入 `vehicles` 後回應 `201` 與該筆資料
- `GET /api/vehicles/:id` 找不到 SHALL 回應 `404`
- `PUT /api/vehicles/:id` SHALL 部分覆寫該筆，找不到 SHALL 回應 `404`
- `DELETE /api/vehicles/:id` SHALL 移除該筆，找不到 SHALL 回應 `404`

`plateNo` 在 `vehicles` 中 SHALL 全域唯一；`POST` 或 `PUT` 違反唯一性 SHALL 回應 `409 { message: '車牌已存在', field: 'plateNo' }`。

#### Scenario: 新增重複車牌

- **WHEN** 收到 `POST /api/vehicles` 的 `plateNo` 與既有資料重複
- **THEN** MSW SHALL 回應 `409`，且 `vehicles` 不變更

#### Scenario: 編輯為與其他車輛重複的車牌

- **WHEN** 收到 `PUT /api/vehicles/:id` 將 `plateNo` 改為與「其他」車輛相同
- **THEN** MSW SHALL 回應 `409`；若改為與「自己」原本相同則 SHALL 視為合法並回應 `200`

#### Scenario: 刪除不存在的車輛

- **WHEN** 收到 `DELETE /api/vehicles/non-existent-id`
- **THEN** MSW SHALL 回應 `404 { message: '車輛不存在' }`

### Requirement: 員工 CRUD（admin-only）與唯一性檢查

`/api/employees` 端點 SHALL 僅允許 `admin` token 通過；通過後依下列規則處理請求：

- `GET /api/employees` SHALL 回應目前 `employees` 全集，依 `hireDate` 由新到舊排序
- `POST /api/employees` SHALL 驗證 body 符合 `employeeSchema`，通過後產生 `id` 並加入 `employees`，回應 `201`
- `PUT /api/employees/:id` SHALL 部分覆寫，找不到回 `404`
- `DELETE /api/employees/:id` SHALL 移除該筆，找不到回 `404`

`email` 在 `employees` 中 SHALL 全域唯一；違反 SHALL 回應 `409 { message: 'Email 已存在', field: 'email' }`。

#### Scenario: user token 嘗試任何員工端點

- **WHEN** 收到任何 `/api/employees*` 請求帶 `user` 角色 token
- **THEN** MSW SHALL 回應 `403`，不洩露員工資料

#### Scenario: 新增重複 email

- **WHEN** admin 送出 `POST /api/employees` 的 `email` 已存在
- **THEN** MSW SHALL 回應 `409`，且 `employees` 不變更

### Requirement: 儀表板統計動態計算

`GET /api/dashboard/stats` SHALL 對所有已登入角色開放，並於每次請求即時依當前 `vehicles` / `employees` 計算回應，欄位如下：

```ts
{
  totals: {
    vehicles: number,         // vehicles.length
    availableVehicles: number, // vehicles.filter(v => v.status === 'available').length
    employees: number,         // employees.length
    addedThisMonth: number,    // 本月新增的車輛數
  },
  statusDistribution: Array<{ status: 'available' | 'in-use' | 'maintenance', count: number }>,
  monthlyAdded: Array<{ month: string /* YYYY-MM */, count: number }>, // 近 6 個月，最舊到最新
}
```

#### Scenario: 新增車輛後立即反映於統計

- **WHEN** 前端先呼叫 `POST /api/vehicles` 成功，再呼叫 `GET /api/dashboard/stats`
- **THEN** `totals.vehicles` 與 `monthlyAdded` 中當月項目 SHALL 各 +1

#### Scenario: monthlyAdded 涵蓋近 6 個月

- **WHEN** 收到 `GET /api/dashboard/stats`
- **THEN** `monthlyAdded` SHALL 為長度 6 的陣列，由「5 個月前」到「本月」依序排列；無資料的月份 `count` SHALL 為 `0`

### Requirement: Handler 模組化與契約共享

MSW handlers SHALL 依 capability 拆檔於 `src/mocks/handlers/` 下：`auth.ts`、`vehicles.ts`、`employees.ts`、`dashboard.ts`，並由 `src/mocks/browser.ts` 彙整為 worker。請求 body 驗證 SHALL 重用 `src/lib/schemas.ts` 中的 zod schema，確保前後端契約一致。

#### Scenario: 修改 schema 後同時影響前端與 mock

- **WHEN** 開發者調整 `vehicleSchema` 中欄位定義
- **THEN** 前端表單驗證與 MSW handler 驗證 SHALL 同步生效，無需在兩處分別維護

#### Scenario: 新增端點僅需新增單一 handler 檔

- **WHEN** 未來需擴充新的資源（如 `maintenance-records`）
- **THEN** 開發者 SHALL 僅需新增 `handlers/maintenance-records.ts` 並於 `browser.ts` 註冊，不影響其他 handler
