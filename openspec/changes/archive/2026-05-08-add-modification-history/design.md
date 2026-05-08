## Context

MVP（`add-vehicle-mgmt-mvp`）已完成基本 CRUD，使用者開始反應「資料變動沒有可追溯性」— 特別是車輛狀態與員工人事異動。為避免每次溝通都要翻 Slack / email，需要一個輕量的「修改歷史」功能。

權限上需要平衡可追溯性與隱私：管理者需要看到全部事件以行使治理；一般使用者通常只需看到車輛事件，但對「與自己有關的員工事件」（如人資修改了自己的部門資訊）也應該知曉，以維持透明度。

本變更不引入額外依賴，純粹疊加在現有 mock 後端與 React + shadcn 前端上。

## Goals / Non-Goals

**Goals:**

- 不影響現有 CRUD 行為的前提下記錄寫入事件（CUD 副作用）
- 角色化的事件可見範圍：admin 全部、user vehicle 全部 + 自己相關 employee
- update 事件呈現欄位級的舊→新值對比，便於肉眼比對
- 篩選介面：依資源類型、動作類型過濾

**Non-Goals:**

- 讀取（GET）行為的審計
- 跨會話持久化（重新整理仍重置，與業務資料一致）
- 回滾 / 復原功能
- IP / User-Agent / 來源等深度元資料
- 全文搜尋 / 分頁
- 寫入後的後續通知（email / Slack）

## Decisions

### D1. User 與 Employee 的關聯：可選的 `employeeId`

User 物件新增 `employeeId?: string` 欄位。Seed 中 `admin` 對應 `e-005`（林雅婷／人資主管）、`user` 對應 `e-001`（張小明／業務）。

**理由**：MVP 沒有「self-service profile」需求，但 audit 過濾需要知道「我是哪個 employee」。

**替代方案**：透過 `username === employee.email` 對應 — 太脆弱（任一邊改了就斷）。

**未來影響**：若新增「使用者編輯自己 profile」功能，這個關聯欄位已就緒。

### D2. Audit log 儲存：in-memory + 與業務資料同生命週期

Audit log 與 `vehicles` / `employees` 一樣存在 module 層級陣列中，重新整理頁面後重置。

**理由**：MVP 範圍內可接受；與既有 mock 資料行為一致；避免引入 IndexedDB / localStorage 的複雜度與意外副作用。

**未來路徑**：若需持久化，可改寫 `recordEvent` 為非同步、寫入 IndexedDB 或上傳真實後端，無需修改埋點處。

### D3. 過濾在後端（mock）端執行而非前端

`/api/history` 在回傳前依 token 解析角色與 `employeeId` 並過濾。前端僅執行 UI 層的二級篩選（資源類型 / 動作類型）。

**理由**：權限不應依賴前端 — 即便 MVP 是 mock，也要遵循「前後端分離」的規範，便於日後切換真實後端。前端拿到的資料就是允許看的資料。

### D4. Update 事件記錄欄位級 diff

僅紀錄變更欄位的 `{ field, from, to }` 陣列，不存完整 before / after snapshot。

**理由**：可讀性高、體積小、UI 直接渲染「a → b」格式。

**取捨**：若未來需要「回到某時刻完整資料」，diff 不夠用 — 屆時改為 snapshot-based。

**邊界**：若 update 沒有實質變更（如使用者按下儲存但什麼都沒改），SHALL 不寫入事件。

### D5. 在 handler 層埋點而非建立 middleware

直接在 `handlers/vehicles.ts`、`handlers/employees.ts` 的 mutation 後呼叫 `recordEvent`。

**理由**：MSW 沒有原生 middleware 概念；用 helper 函式呼叫比包 wrapper 簡單；變更範圍小、易讀。

**缺點**：每個 handler 要手動加 `recordEvent`，未來新增資源時可能漏。透過 spec 中明確要求 + code review 把關。

### D6. UI：單一全域頁面 + 雙篩選

新增 `/history` 路由，sidebar 顯示「修改歷史」連結（admin / user 皆可見）；表格 6 欄（時間、操作者、動作、資源、對象、變更）；shadcn `Select` 實作資源 / 動作雙篩選。

**理由**：與現有頁面（vehicles / employees）UX 一致；雙下拉足夠 MVP；不需要在每筆資料旁加抽屜。

## Risks / Trade-offs

- **資料量增長 → 表格載入慢**：MVP 不在意（重整即清）；未來實裝若量大需 pagination + 後端篩選
- **diff 對巢狀物件不友善**：目前 schema 都是 flat，未來若有 nested fields 需重做 diff 函式
- **user 看不到任何 employee 事件（若 seed 沒連結）**：透過 seed 預設連結確保 demo 有資料；於 README 明示
- **新增資源時忘記埋點**：透過本 change 的 mock-api spec 中的 requirement 強制 — 任何新資源 capability 必須補上 audit hook，並由 review 把關
- **employeeId 若未來透過 GET /api/auth/me 暴露**：當前不暴露，避免讓前端誤用為權限判斷依據；若未來需要 self-service，再評估是否暴露

## Migration Plan

不適用（純疊加功能；audit log 由空陣列起算，不需資料遷移）。

切換到真實後端時：

1. `recordEvent` 改為呼叫真實 audit endpoint
2. `GET /api/history` 改為實際後端 URL，過濾邏輯由後端負責
3. 移除 `auditLog` in-memory 陣列

## Open Questions

- 未來若導入 self-service profile（user 可改自己的 employee 資料），UI 應該如何標示「這是我自己做的」vs.「別人對我做的」？暫定不區分
- 是否需要對 audit log 加保留期 / 容量上限？目前無上限；若量大再評估
- update 事件若同時改了多個欄位（如同時改 `status` + `assignedTo`），目前合併為一筆事件含多個 changes — 是否要拆成多筆？暫定合併（語意上是一次操作）
