# auth

## Purpose

提供帳號密碼登入、Session 持久化、登出、路由權限守衛，以及 user ↔ employee 的關聯欄位（給 audit / 個人化使用）。

## Requirements

### Requirement: 帳號密碼登入

系統 SHALL 提供登入頁面，接受 `username` 與 `password` 兩個欄位，並對應後端 `POST /api/auth/login` 進行驗證。驗證成功後 SHALL 將 `{ token, user }` 寫入 `localStorage` 與 `AuthContext`，並導向 `/`（儀表板）。

#### Scenario: 以 admin 身分成功登入

- **WHEN** 使用者於登入頁輸入 `admin` / `admin123` 並送出
- **THEN** 系統 SHALL 顯示載入狀態、收到成功回應後將 user 角色標記為 `admin`，並導向 `/`

#### Scenario: 以 user 身分成功登入

- **WHEN** 使用者於登入頁輸入 `user` / `user123` 並送出
- **THEN** 系統 SHALL 將 user 角色標記為 `user`，並導向 `/`

#### Scenario: 帳號或密碼錯誤

- **WHEN** 使用者輸入不存在的帳號或錯誤的密碼並送出
- **THEN** 系統 SHALL 顯示錯誤訊息「帳號或密碼錯誤」，且不寫入 session、不執行導向

#### Scenario: 欄位未填寫

- **WHEN** 使用者未填 `username` 或 `password` 即送出
- **THEN** 系統 SHALL 於對應欄位顯示「必填」錯誤，且不發送 API 請求

### Requirement: Session 持久化與自動還原

系統 SHALL 在 App 啟動時讀取 `localStorage` 中的 session，若存在則寫回 `AuthContext`，使重新整理後仍維持登入狀態。

#### Scenario: 已登入後重新整理頁面

- **WHEN** 已登入使用者重新整理瀏覽器
- **THEN** 系統 SHALL 自 `localStorage` 還原 session，停留於原頁面，無須重新登入

#### Scenario: localStorage 無 session

- **WHEN** 使用者首次造訪或清除瀏覽器資料後造訪受保護頁面
- **THEN** 系統 SHALL 導向 `/login`

### Requirement: 登出

系統 SHALL 在頂部導覽列提供「登出」按鈕，點擊後 SHALL 清除 `AuthContext` 與 `localStorage` 的 session，並導向 `/login`。

#### Scenario: 使用者點擊登出

- **WHEN** 已登入使用者點擊登出按鈕
- **THEN** 系統 SHALL 清除 session 並導向 `/login`

### Requirement: 路由權限守衛

系統 SHALL 提供 `<ProtectedRoute>` 與 `<AdminRoute>` 兩種路由守衛：

- `<ProtectedRoute>`：未登入則導向 `/login`
- `<AdminRoute>`：需登入且角色為 `admin`，否則導向 `/`

#### Scenario: 未登入存取受保護頁面

- **WHEN** 未登入使用者直接造訪 `/vehicles`
- **THEN** 系統 SHALL 導向 `/login`

#### Scenario: user 角色嘗試進入員工管理頁

- **WHEN** 角色為 `user` 的使用者直接造訪 `/employees`
- **THEN** 系統 SHALL 導向 `/`

#### Scenario: admin 角色進入員工管理頁

- **WHEN** 角色為 `admin` 的使用者造訪 `/employees`
- **THEN** 系統 SHALL 正常顯示員工管理頁

### Requirement: User 物件帶有可選的 employeeId

`auth` 中的 User 物件（包括 seed 與 schema 定義）SHALL 包含選填欄位 `employeeId?: string`，用以建立 user 帳號與 `employees` 表中某筆資料的對應關係。`employeeId` SHALL NOT 出現在登入回應、`/api/auth/me` 回應、token 字串中 — 屬於 server-only 資訊，僅供 mock handler 內部判斷權限使用（例如 `/api/history` 過濾 employee 事件）。

#### Scenario: seed 帳號帶 employeeId

- **WHEN** seed users 初始化
- **THEN** admin SHALL 帶 `employeeId = 'e-005'`、user SHALL 帶 `employeeId = 'e-001'`

#### Scenario: 登入後 token 不洩露 employeeId

- **WHEN** 使用者透過 `POST /api/auth/login` 登入
- **THEN** token 字串 SHALL 維持 `mock-token-<userId>-<role>` 格式，不包含 employeeId

#### Scenario: GET /api/auth/me 不暴露 employeeId

- **WHEN** 已登入使用者呼叫 `GET /api/auth/me`
- **THEN** 回應 user 物件 SHALL 僅包含 `id`、`username`、`role`，不暴露 employeeId（避免讓前端誤用作權限判斷）

#### Scenario: 使用者無 employeeId 時仍可正常登入

- **WHEN** 一個未連結 employee 的 user 帳號登入
- **THEN** 登入流程 SHALL 不受影響、`isAuthenticated` 為 true、可瀏覽所有授權頁面；唯獨 `/api/history` 不會回傳任何 employee 事件
