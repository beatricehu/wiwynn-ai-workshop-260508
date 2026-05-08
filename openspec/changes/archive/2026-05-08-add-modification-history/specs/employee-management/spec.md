## ADDED Requirements

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
