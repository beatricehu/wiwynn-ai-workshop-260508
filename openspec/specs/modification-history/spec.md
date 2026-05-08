# modification-history

## Purpose

審計事件列表頁面（`/history`），呈現 vehicle / employee 的寫入紀錄；依角色（admin / user）與使用者連結（`employeeId`）控制可見範圍。

## Requirements

### Requirement: 修改歷史頁面（已登入皆可進）

系統 SHALL 提供 `/history` 路由，所有已登入使用者皆可進入。頁面 SHALL 呼叫 `GET /api/history` 取得審計事件列表，以表格呈現「時間、操作者（含角色 badge）、動作、資源、對象、變更」六欄。

#### Scenario: admin 進入 /history

- **WHEN** admin 進入 `/history`
- **THEN** 系統 SHALL 呼叫 `GET /api/history`、載入中顯示骨架屏、成功後渲染表格、副標說明「顯示所有資源的修改紀錄」

#### Scenario: user 進入 /history

- **WHEN** user 進入 `/history`
- **THEN** 系統 SHALL 呼叫 `GET /api/history`、副標說明「顯示所有車輛事件，以及與您相關的員工事件」

#### Scenario: 未登入存取 /history

- **WHEN** 未登入使用者直接造訪 `/history`
- **THEN** 系統 SHALL 由 `<ProtectedRoute>` 導向 `/login`

#### Scenario: 列表為空

- **WHEN** API 回應空陣列（剛開始 / seed 尚無事件）
- **THEN** 系統 SHALL 顯示「尚無修改紀錄。試著新增/編輯/刪除一筆資料看看」

### Requirement: 資源 / 動作雙篩選

頁面 SHALL 提供「資源類型」與「動作類型」兩個下拉篩選器，篩選作用於前端已取得的事件清單，不重新發送 API 請求。

- 資源：`all` / `vehicle` / `employee`
- 動作：`all` / `create` / `update` / `delete`

#### Scenario: 切換為僅顯示車輛

- **WHEN** 使用者將資源篩選切為「車輛」
- **THEN** 系統 SHALL 在不重新呼叫 API 的前提下，將表格過濾為僅 `resource === 'vehicle'` 的事件

#### Scenario: 同時套用資源與動作篩選

- **WHEN** 資源 = `vehicle`、動作 = `update`
- **THEN** 系統 SHALL 僅顯示同時符合 `resource === 'vehicle'` 與 `action === 'update'` 的事件

#### Scenario: 篩選後無資料

- **WHEN** 套用篩選後 visible 列表為空、但 events 並非全空
- **THEN** 系統 SHALL 顯示「目前篩選條件下無紀錄」訊息

### Requirement: Update 事件呈現欄位級對比

當事件 `action === 'update'` 且 `changes` 有資料時，「變更」欄 SHALL 列出每個 change 的 `field`、舊值（刪除線樣式）、`→`、新值（前景色樣式）。多個 change 在同一儲存格中以多行排列。

#### Scenario: 顯示車輛 status 變更

- **WHEN** 表格列出某 update 事件 `changes: [{ field: 'status', from: 'available', to: 'in-use' }]`
- **THEN** 系統 SHALL 渲染為「status: ~~available~~ → in-use」

#### Scenario: 空值 / null 顯示

- **WHEN** change 的 from 或 to 為 `null` / `undefined` / 空字串
- **THEN** 系統 SHALL 顯示「（空）」而非顯示空白

#### Scenario: create / delete 事件

- **WHEN** 事件為 create 或 delete
- **THEN** 系統 SHALL 在「變更」欄顯示 `—`（不渲染 changes）

### Requirement: 操作者與動作以 badge 區分

「操作者」欄 SHALL 顯示使用者 username 並附上角色 badge（admin / user 採不同色）；「動作」欄 SHALL 以不同色 badge 標示 create（綠）/ update（藍）/ delete（紅）。

#### Scenario: admin 操作的事件

- **WHEN** 表格渲染某 admin 觸發的事件
- **THEN** 操作者欄 SHALL 顯示 `admin` + 紫色 admin badge

#### Scenario: 不同動作色彩

- **WHEN** 表格同時包含 create / update / delete 事件
- **THEN** 系統 SHALL 以三種不同色 badge 區分，便於肉眼掃描

### Requirement: Sidebar 顯示「修改歷史」連結

主版面導覽列 SHALL 對所有已登入使用者顯示「修改歷史」連結（不分角色）。

#### Scenario: 連結顯示與生效

- **WHEN** 已登入使用者檢視主版面
- **THEN** 系統 SHALL 在 sidebar 顯示「修改歷史」連結，圖示為 `History`，點擊後導向 `/history`
