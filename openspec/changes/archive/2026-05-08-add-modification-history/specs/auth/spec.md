## ADDED Requirements

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
