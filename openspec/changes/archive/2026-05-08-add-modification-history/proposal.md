## Why

MVP 上線後，使用者反映「不知道誰在何時改了什麼」，特別是車輛狀態與員工資料異動，導致跨部門對帳困難。為提升可追溯性、同時保留隱私分級（一般使用者不應全面看到員工層級異動），需要一個輕量的修改歷史功能 — 記錄寫入動作（create / update / delete）並依角色過濾可見範圍。

## What Changes

- 新增 `modification-history` capability：`/history` 頁面以表格呈現審計事件 + 資源 / 動作雙篩選
- 新增 `GET /api/history` mock 端點，依角色過濾事件可見範圍：
  - `admin`：全部事件（vehicle + employee）
  - `user`：全部 vehicle 事件 + 與「自己關聯員工」的 employee 事件
- 在 `auth` 的 User 物件加入選填欄位 `employeeId`，建立帳號 ↔ 員工資料的對應關係
- 在 `vehicle-management` 與 `employee-management` 的所有 CUD 流程埋入 audit 事件記錄（含欄位級 diff for update）
- 在 `mock-api` 中新增 in-memory `auditLog`、`recordEvent` helper、以及 history endpoint

## Capabilities

### New Capabilities

- `modification-history`：審計事件列表頁、資源 / 動作篩選、按角色限定可視範圍

### Modified Capabilities

- `auth`：User schema 新增 `employeeId?`
- `vehicle-management`：所有 CUD 操作記錄審計事件
- `employee-management`：所有 CUD 操作記錄審計事件
- `mock-api`：新增 in-memory audit log 與 `/api/history` 端點

## Impact

- **新增程式碼**：`src/pages/history.tsx`、`src/mocks/audit-log.ts`、`src/mocks/handlers/history.ts`
- **修改程式碼**：`src/lib/schemas.ts`（+ AuditEvent / employeeId）、`src/mocks/db.ts`（seed users 加 employeeId）、`src/mocks/handlers/{vehicles,employees}.ts`（埋點）、`src/mocks/browser.ts`、`src/router.tsx`、`src/components/app-layout.tsx`
- **不影響**：dashboard 統計邏輯、登入 / 登出流程、shadcn 元件
- **限制**：audit log 為 in-memory，重新整理頁面後重置（與業務資料一致行為）；不涵蓋讀取 / 失敗的請求；不支援回滾
