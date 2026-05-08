## ADDED Requirements

### Requirement: 車輛 CUD 動作須記錄審計事件

每次 `POST /api/vehicles`、`PUT /api/vehicles/:id`、`DELETE /api/vehicles/:id` 「成功」後，系統 SHALL 在 audit log 中追加一筆事件，內容包含：

- `actor`：當前使用者 `{ userId, username, role }`
- `resource`：固定為 `'vehicle'`
- `resourceId`：車輛 id
- `resourceLabel`：車輛 `plateNo`
- `action`：`'create'` / `'update'` / `'delete'`
- `createdAt`：ISO 字串
- `changes`（僅 update 事件）：`{ field, from, to }[]`

寫入時機 SHALL 在資料異動之後。`update` 事件若 diff 為空（無實質變更）SHALL NOT 寫入。任何 mutation 失敗（驗證錯誤、唯一性衝突、404 等）SHALL NOT 寫入。

#### Scenario: 新增車輛

- **WHEN** 使用者成功 `POST /api/vehicles`
- **THEN** 系統 SHALL 寫入一筆 `action: 'create'` 事件，`resourceLabel` 為新車的 `plateNo`

#### Scenario: 編輯車輛（有變更）

- **WHEN** 使用者 `PUT /api/vehicles/:id` 將 `status` 從 `available` 改為 `in-use`
- **THEN** 系統 SHALL 寫入一筆 `action: 'update'` 事件，`changes` 至少包含 `{ field: 'status', from: 'available', to: 'in-use' }`

#### Scenario: 編輯車輛但無實質變更

- **WHEN** 使用者送出與原本完全相同的 PUT 內容
- **THEN** 系統 SHALL 仍回應 200，但 SHALL NOT 寫入 audit 事件

#### Scenario: 刪除車輛

- **WHEN** 使用者成功 `DELETE /api/vehicles/:id`
- **THEN** 系統 SHALL 在資料移除前抓取 `plateNo`，寫入 `action: 'delete'` 事件、`resourceLabel` 為被刪除車輛的車牌

#### Scenario: 重複車牌導致 409

- **WHEN** `POST` 或 `PUT` 因 `plateNo` 衝突回應 409
- **THEN** 系統 SHALL NOT 寫入 audit 事件（因實際資料未變更）

#### Scenario: user 角色操作

- **WHEN** 一般使用者（user）執行 vehicle 的任意 CUD
- **THEN** 系統 SHALL 比照記錄事件，`actor.role` 為 `'user'`
