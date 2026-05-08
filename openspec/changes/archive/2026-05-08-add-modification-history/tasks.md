## 1. Schema / 資料模型擴充

- [x] 1.1 `src/lib/schemas.ts` 加入 `AuditEvent` / `AuditAction` / `AuditResource` / `AuditChange` 型別
- [x] 1.2 `src/lib/schemas.ts` 的 `userSchema` 加入選填欄位 `employeeId`
- [x] 1.3 `src/mocks/db.ts` 的 seed users 補上 employeeId（admin → `e-005`、user → `e-001`）

## 2. Audit log 模組

- [x] 2.1 建立 `src/mocks/audit-log.ts`：export `auditLog`、`recordEvent`、`diff` helper
- [x] 2.2 `recordEvent` 須產生 id（沿用 `generateId`）、寫入 `createdAt = now()`、push 到 auditLog 並回傳該事件
- [x] 2.3 `diff` 僅比對 next 物件中存在的 keys，回傳 `{ field, from, to }[]`，相同值不出現在結果中

## 3. 在現有 handlers 埋點

- [x] 3.1 `vehicles.ts`：POST 成功後 `recordEvent(create)`；PUT 比對 diff，有變更時 `recordEvent(update)`；DELETE 在 splice 前抓取 plate 後 `recordEvent(delete)`
- [x] 3.2 `employees.ts`：同上，`resourceLabel` 使用 `name`
- [x] 3.3 mutation 失敗（驗證錯誤 / 唯一性衝突 / 404）時 SHALL NOT 寫入事件

## 4. /api/history endpoint

- [x] 4.1 建立 `src/mocks/handlers/history.ts`，實作 `GET /api/history`
- [x] 4.2 `admin` 角色：回傳全部 auditLog（依 createdAt 由新到舊排序）
- [x] 4.3 `user` 角色：回傳 vehicle 全部 + employee 中 `resourceId === currentUser.employeeId` 的事件
- [x] 4.4 user 無 `employeeId` 時，employee 事件全部過濾掉
- [x] 4.5 未登入：回應 401（沿用 `requireAuth`）
- [x] 4.6 在 `src/mocks/browser.ts` 註冊 `historyHandlers`

## 5. 前端：頁面 + 路由 + 導覽

- [x] 5.1 建立 `src/pages/history.tsx`，呼叫 `GET /api/history`，實作 loading / error / empty 狀態
- [x] 5.2 表格 6 欄（時間、操作者、動作、資源、對象、變更）；update 事件展開 changes 並顯示「from → to」
- [x] 5.3 篩選器：資源（all / vehicle / employee）、動作（all / create / update / delete），純前端篩選顯示
- [x] 5.4 `src/router.tsx` 加入 `/history` 路由（包在 ProtectedRoute）
- [x] 5.5 `src/components/app-layout.tsx` 的 navItems 加入「修改歷史」連結，admin / user 皆可見

## 6. 驗證與收尾

- [x] 6.1 `npx tsc -b` 無錯誤
- [x] 6.2 `npm run lint` 無新錯誤（既有 shadcn fast-refresh warnings 不計）
- [x] 6.3 瀏覽器手動驗證：admin 看全部、user 只看 vehicle 事件 + 與自己相關員工事件
- [x] 6.4 瀏覽器手動驗證：篩選器運作正常、empty / loading / error 狀態
- [ ] 6.5 README 增補「修改歷史」段落（功能、權限規則、限制） — 延後
