## ADDED Requirements

### Requirement: 車輛列表檢視

車輛管理頁（路徑 `/vehicles`）SHALL 以表格呈現所有車輛，欄位包含 `plateNo`（車牌）、`brand`、`model`、`year`、`status`、`assignedTo`，以及操作欄（編輯 / 刪除）。資料來源為 `GET /api/vehicles`。

#### Scenario: 載入車輛列表

- **WHEN** 已登入使用者進入 `/vehicles`
- **THEN** 系統 SHALL 呼叫 `GET /api/vehicles`，載入中顯示骨架屏，成功後以表格呈現資料

#### Scenario: 車輛列表為空

- **WHEN** API 回應空陣列
- **THEN** 系統 SHALL 顯示「尚無車輛資料」空狀態，並提供「新增車輛」按鈕

### Requirement: 新增車輛

車輛管理頁 SHALL 提供「新增車輛」按鈕，點擊後開啟 dialog 表單，欄位為：`plateNo`、`brand`、`model`、`year`、`status`、`assignedTo`（選填）。送出後呼叫 `POST /api/vehicles`，成功則關閉 dialog 並重新整理列表。

#### Scenario: 成功新增車輛

- **WHEN** 使用者填妥必填欄位（`plateNo`、`brand`、`model`、`year`、`status`）並送出
- **THEN** 系統 SHALL 呼叫 `POST /api/vehicles`，成功後關閉 dialog、列表新增該筆資料、顯示 toast「新增成功」

#### Scenario: 必填欄位未填

- **WHEN** 使用者未填 `plateNo` 即送出
- **THEN** 系統 SHALL 於該欄位顯示「必填」錯誤，且不發送 API 請求

#### Scenario: 車牌重複

- **WHEN** 使用者填入已存在的 `plateNo` 並送出
- **THEN** 系統 SHALL 顯示錯誤訊息「車牌已存在」，且 dialog 維持開啟

### Requirement: 編輯車輛

車輛列表的每一列 SHALL 提供「編輯」按鈕，點擊後開啟與新增相同的 dialog 表單但預先帶入現有資料。送出後呼叫 `PUT /api/vehicles/:id`。

#### Scenario: 成功編輯車輛

- **WHEN** 使用者點擊某列的「編輯」、修改欄位後送出
- **THEN** 系統 SHALL 呼叫 `PUT /api/vehicles/:id`，成功後關閉 dialog、列表更新該筆資料、顯示 toast「更新成功」

### Requirement: 刪除車輛

車輛列表的每一列 SHALL 提供「刪除」按鈕，點擊後 SHALL 顯示確認 dialog，使用者確認後呼叫 `DELETE /api/vehicles/:id`。

#### Scenario: 成功刪除車輛

- **WHEN** 使用者點擊某列的「刪除」並於確認 dialog 點擊「確認」
- **THEN** 系統 SHALL 呼叫 `DELETE /api/vehicles/:id`，成功後該筆從列表移除、顯示 toast「刪除成功」

#### Scenario: 取消刪除

- **WHEN** 使用者於確認 dialog 點擊「取消」
- **THEN** 系統 SHALL 關閉 dialog，不執行任何 API 呼叫

### Requirement: user 與 admin 皆可使用車輛管理

車輛管理頁 SHALL 對 `user` 與 `admin` 角色皆開放完整 CRUD 功能。

#### Scenario: user 角色執行 CRUD

- **WHEN** 角色為 `user` 的使用者進入 `/vehicles`
- **THEN** 系統 SHALL 顯示完整列表與「新增 / 編輯 / 刪除」按鈕，且操作不受權限限制
