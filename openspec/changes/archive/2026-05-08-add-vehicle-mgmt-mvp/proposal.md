## Why

目前團隊缺少一個用以管理車輛與員工資料的內部系統，導致資料散落在試算表中、無法即時掌握營運概況。為快速驗證系統價值並蒐集使用者回饋，需先打造一個可登入、具備角色權限與基礎 CRUD 能力的最小可行版本（MVP）；後端尚未就緒，因此採 MSW 模擬 API，讓前端可獨立完成驗證。

## What Changes

- 新增登入頁面：以帳號密碼驗證身分，支援 `admin` 與 `user` 兩種角色，登入狀態持久化至 `localStorage`
- 新增首頁儀表板：頂部以卡片呈現關鍵數據（總車輛數、可用車輛數、員工數、本月新增），下方以圖表呈現車輛狀態分佈與趨勢
- 新增車輛管理頁：所有登入者皆可檢視 / 新增 / 編輯 / 刪除車輛資料
- 新增員工管理頁：僅 `admin` 角色可進入並執行 CRUD；`user` 角色嘗試進入時導回儀表板
- 新增前端路由與權限保護機制（未登入導向 `/login`、無權限導向 `/`）
- 新增 MSW 設定：所有 API 路徑由 mock handler 處理，資料保存在記憶體（重新整理後重置為 seed data）

## Capabilities

### New Capabilities

- `auth`: 帳密登入、登出、角色區分（admin / user）、session 持久化與路由守衛
- `dashboard`: 首頁儀表板，呈現關鍵數據卡片與資料圖表
- `vehicle-management`: 車輛資料的列表檢視、新增、編輯、刪除（所有登入者）
- `employee-management`: 員工資料的列表檢視、新增、編輯、刪除（僅 admin）
- `mock-api`: MSW 模擬後端 — in-memory seed、token-based 授權、CRUD 唯一性檢查、儀表板統計動態計算

### Modified Capabilities

<!-- 無：本專案目前尚無既有 spec -->

## Impact

- **新增依賴**：`react`、`react-router-dom`、`shadcn/ui`（含 Magic UI 元件）、`tailwindcss`、`msw`、`recharts`（或同等圖表庫）、`zod`（表單驗證）、`react-hook-form`
- **新增程式碼**：`src/pages/`（Login / Dashboard / Vehicles / Employees）、`src/components/`（共用 UI 與業務元件）、`src/mocks/`（MSW handlers + seed data）、`src/lib/`（auth、api client、route guard）
- **不影響**：現有 `src/skills/` 內容（echo skill 與其測試保持原樣）
- **限制**：MVP 不串接真實後端、不做密碼雜湊、不做 refresh token、資料僅存於記憶體
