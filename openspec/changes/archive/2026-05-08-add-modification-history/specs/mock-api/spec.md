## ADDED Requirements

### Requirement: In-Memory Audit Log 模組

系統 SHALL 在 `src/mocks/audit-log.ts` 維護 in-memory `auditLog: AuditEvent[]`，並 export `recordEvent(input)` 與 `diff(prev, next)` 兩個 helper。所有寫入 audit log 的操作 SHALL 透過 `recordEvent`，不允許其他 module 直接操作 `auditLog` 陣列。

`AuditEvent` 結構：

```ts
{
  id: string;             // 由 generateId('a') 產生
  resource: 'vehicle' | 'employee';
  resourceId: string;
  resourceLabel: string;  // 顯示用：plateNo / name
  action: 'create' | 'update' | 'delete';
  actor: { userId: string; username: string; role: 'admin' | 'user' };
  changes?: Array<{ field: string; from: unknown; to: unknown }>;
  createdAt: string;      // ISO
}
```

重新整理頁面後 SHALL 重置為空陣列（與業務資料一致行為）。

#### Scenario: 寫入事件

- **WHEN** 任一 handler 呼叫 `recordEvent(input)`
- **THEN** 系統 SHALL 產生 id（`generateId('a')`）、寫入 `createdAt = new Date().toISOString()`、push 到 `auditLog` 並回傳該事件

#### Scenario: diff helper 比對欄位

- **WHEN** handler 呼叫 `diff(prev, next)` 比對兩個物件
- **THEN** 系統 SHALL 僅比對 `next` 中存在的 keys；相同值（含 `null === null`）SHALL NOT 出現在結果中；不同值 SHALL 以 `{ field, from, to }` 結構回傳

#### Scenario: 重新整理後重置

- **WHEN** 使用者新增任意事件後重新整理瀏覽器
- **THEN** `auditLog` SHALL 還原為空陣列

### Requirement: GET /api/history 端點

系統 SHALL 提供 `GET /api/history`，所有已登入角色（admin / user）皆可呼叫。回應為依當前使用者角色過濾後的事件陣列，並以 `createdAt` 由新到舊排序。

**過濾規則：**

- `admin`：回傳全部事件（vehicle + employee）
- `user`：回傳全部 vehicle 事件 + 過濾後的 employee 事件（`resourceId === currentUser.employeeId`）
- 過濾於 mock handler 端執行，前端 SHALL NOT 收到不應看到的事件

#### Scenario: admin 取得全部事件

- **WHEN** admin 呼叫 `GET /api/history`
- **THEN** MSW SHALL 回傳全部 `auditLog`，依 createdAt 由新到舊排序

#### Scenario: user 過濾規則生效

- **WHEN** 角色為 user 且 `employeeId === 'e-001'` 的使用者呼叫 `GET /api/history`
- **THEN** 回應 SHALL 包含全部 vehicle 事件，且 employee 事件 SHALL 僅含 `resourceId === 'e-001'` 的事件

#### Scenario: user 無 employeeId 時無 employee 事件

- **WHEN** 一個 `employeeId` 為 `undefined` 的 user 呼叫此端點
- **THEN** 回應 SHALL 不包含任何 employee 事件，僅含 vehicle 事件

#### Scenario: 未登入

- **WHEN** 無 `Authorization` header 呼叫 `GET /api/history`
- **THEN** MSW SHALL 回應 `401 { message: '未登入' }`

#### Scenario: token 無效

- **WHEN** 帶不合法 token 呼叫此端點
- **THEN** MSW SHALL 回應 `401 { message: '未登入' }`，不回傳任何事件

### Requirement: 新增資源 capability 時須補上 audit hook

任何未來新增的 mutation 端點（不限於 vehicle / employee）SHALL 在成功寫入後呼叫 `recordEvent`，並比照 `vehicle-management` / `employee-management` 的規範決定 `resource`、`resourceLabel`、是否計算 diff 等。

#### Scenario: 新增 maintenance-records 資源

- **WHEN** 未來新增 `/api/maintenance-records` 端點群
- **THEN** 該 capability 的 spec SHALL 包含「CUD 動作須記錄審計事件」要求；handler 實作 SHALL 在每個 mutation 後呼叫 `recordEvent`，並讓 `/api/history` 過濾規則覆蓋此資源（必要時擴充 user 過濾條件）
