# employee-management

## Purpose

提供管理者（admin）對員工資料的列表檢視與 CRUD；user 角色不可進入。每次寫入動作會記錄審計事件。

## Requirements

### Requirement: 員工列表檢視（僅 admin）

員工管理頁（路徑 `/employees`）SHALL 以表格呈現所有員工，欄位包含 `name`、`email`、`department`、`role`、`hireDate`，以及操作欄（編輯 / 刪除）。資料來源為 `GET /api/employees`。此頁僅 `admin` 角色可進入；非 admin 由路由守衛導回 `/`。

#### Scenario: admin 載入員工列表

- **WHEN** 角色為 `admin` 的使用者進入 `/employees`
- **THEN** 系統 SHALL 呼叫 `GET /api/employees`，載入中顯示骨架屏，成功後以表格呈現資料

#### Scenario: user 嘗試進入員工管理頁

- **WHEN** 角色為 `user` 的使用者直接造訪 `/employees`
- **THEN** 系統 SHALL 由路由守衛導向 `/`，不發送 API 請求

#### Scenario: 員工列表為空

- **WHEN** API 回應空陣列
- **THEN** 系統 SHALL 顯示「尚無員工資料」空狀態，並提供「新增員工」按鈕

### Requirement: 新增員工（僅 admin）

員工管理頁 SHALL 提供「新增員工」按鈕，點擊後開啟 dialog 表單，欄位為：`name`、`email`、`department`、`role`、`hireDate`。送出後呼叫 `POST /api/employees`，成功則關閉 dialog 並重新整理列表。

#### Scenario: 成功新增員工

- **WHEN** admin 填妥必填欄位並送出
- **THEN** 系統 SHALL 呼叫 `POST /api/employees`，成功後關閉 dialog、列表新增該筆資料、顯示 toast「新增成功」

#### Scenario: email 格式錯誤

- **WHEN** 使用者填入不符合 email 格式的字串並送出
- **THEN** 系統 SHALL 於 email 欄位顯示「請輸入有效的 email」，且不發送 API 請求

#### Scenario: email 重複

- **WHEN** 使用者填入已存在的 email 並送出
- **THEN** 系統 SHALL 顯示錯誤訊息「Email 已存在」，且 dialog 維持開啟

### Requirement: 編輯員工（僅 admin）

員工列表的每一列 SHALL 提供「編輯」按鈕，點擊後開啟與新增相同的 dialog 表單但預先帶入現有資料。送出後呼叫 `PUT /api/employees/:id`。

#### Scenario: 成功編輯員工

- **WHEN** admin 點擊某列的「編輯」、修改欄位後送出
- **THEN** 系統 SHALL 呼叫 `PUT /api/employees/:id`，成功後關閉 dialog、列表更新該筆資料、顯示 toast「更新成功」

### Requirement: 刪除員工（僅 admin）

員工列表的每一列 SHALL 提供「刪除」按鈕，點擊後 SHALL 顯示確認 dialog，admin 確認後呼叫 `DELETE /api/employees/:id`。

#### Scenario: 成功刪除員工

- **WHEN** admin 點擊某列的「刪除」並於確認 dialog 點擊「確認」
- **THEN** 系統 SHALL 呼叫 `DELETE /api/employees/:id`，成功後該筆從列表移除、顯示 toast「刪除成功」

#### Scenario: 後端拒絕（非 admin token）

- **WHEN** 任何 `/api/employees/*` 請求未帶有 admin 角色 token
- **THEN** MSW handler SHALL 回應 HTTP 403，前端 SHALL 顯示「權限不足」toast

### Requirement: 導覽列只對 admin 顯示員工管理連結

主版面的導覽列 SHALL 僅在當前使用者角色為 `admin` 時顯示「員工管理」連結；user 角色不顯示。

#### Scenario: admin 看見員工管理連結

- **WHEN** admin 登入後檢視主版面
- **THEN** 系統 SHALL 在導覽列顯示「員工管理」連結

#### Scenario: user 不會看見員工管理連結

- **WHEN** user 登入後檢視主版面
- **THEN** 系統 SHALL 不顯示「員工管理」連結

### Requirement: 員工 CUD 動作須記錄審計事件

每次員工 `POST /api/employees`、`PUT /api/employees/:id`、`DELETE /api/employees/:id` 「成功」後（admin token 通過），系統 SHALL 在 audit log 中追加一筆事件：

- `resource`：固定為 `'employee'`
- `resourceId`：員工 id
- `resourceLabel`：員工 `name`
- 其他欄位（actor / action / createdAt / changes）規則同 `vehicle-management`

`update` 事件若 diff 為空 SHALL NOT 寫入；mutation 失敗（驗證錯誤、email 衝突、403、404）SHALL NOT 寫入。

#### Scenario: 新增員工

- **WHEN** admin 成功 `POST /api/employees`
- **THEN** 系統 SHALL 寫入一筆 `action: 'create'` 事件，`resourceLabel` 為新員工的 `name`

#### Scenario: 修改員工部門

- **WHEN** admin `PUT /api/employees/e-001` 將 `department` 從 `業務部` 改為 `技術部`
- **THEN** 系統 SHALL 寫入 update 事件，`changes` 包含 `{ field: 'department', from: '業務部', to: '技術部' }`

#### Scenario: 刪除員工

- **WHEN** admin 成功 `DELETE /api/employees/:id`
- **THEN** 系統 SHALL 在 splice 前抓取 `name`，寫入 delete 事件、`resourceLabel` 為被刪除員工的姓名

#### Scenario: 非 admin 嘗試員工 CUD

- **WHEN** user token 嘗試員工 mutation 並被回應 403
- **THEN** 系統 SHALL NOT 寫入 audit 事件（資料未變更）

#### Scenario: Email 衝突

- **WHEN** `POST` / `PUT` 因 `email` 衝突回應 409
- **THEN** 系統 SHALL NOT 寫入 audit 事件
