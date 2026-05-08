## ADDED Requirements

### Requirement: 關鍵數據卡片

儀表板頁面（路徑 `/`）SHALL 在頂部以卡片排列方式呈現以下四項關鍵數據：總車輛數、可用車輛數、員工總數、本月新增車輛數。資料來源為 `GET /api/dashboard/stats`。

#### Scenario: 載入儀表板

- **WHEN** 已登入使用者進入 `/`
- **THEN** 系統 SHALL 呼叫 `GET /api/dashboard/stats`，於資料返回前顯示骨架屏（skeleton），返回後以四張卡片顯示對應數值

#### Scenario: API 回應失敗

- **WHEN** `GET /api/dashboard/stats` 回應錯誤
- **THEN** 系統 SHALL 顯示「無法載入數據」訊息，並提供重試按鈕

### Requirement: 資料圖表

儀表板頁面 SHALL 在卡片下方至少顯示兩個圖表：

- 圖表 1：車輛狀態分佈（依 `available` / `in-use` / `maintenance` 分類，長條圖或圓餅圖）
- 圖表 2：近 6 個月新增車輛數趨勢（折線圖）

#### Scenario: 圖表正常顯示

- **WHEN** `GET /api/dashboard/stats` 回應成功
- **THEN** 系統 SHALL 依回應中的 `statusDistribution` 與 `monthlyAdded` 陣列繪製對應圖表

#### Scenario: 圖表無資料

- **WHEN** 回應中的圖表資料為空陣列
- **THEN** 系統 SHALL 顯示「目前無資料」placeholder，而非空白圖表

### Requirement: user 與 admin 皆可檢視儀表板

儀表板 SHALL 對 `user` 與 `admin` 角色皆開放，內容相同（MVP 不依角色客製化）。

#### Scenario: user 角色檢視儀表板

- **WHEN** 角色為 `user` 的使用者進入 `/`
- **THEN** 系統 SHALL 正常顯示卡片與圖表

#### Scenario: admin 角色檢視儀表板

- **WHEN** 角色為 `admin` 的使用者進入 `/`
- **THEN** 系統 SHALL 正常顯示卡片與圖表
