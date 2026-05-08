# Build with AI — 課程範例專案

這是一個 AI 課程的範例專案，內含兩個彼此獨立又相關的部分：

1. **Agent Skills 教材** — `.agents/skills/` 下放置一組可重用的 Skill 提示詞腳本，
   供學員練習如何與 AI 協作（git commit 拆分、PR 描述、測試案例產生等）。
2. **車輛管理系統 MVP** — `src/` 下是一個以 OpenSpec 流程實作的 SPA
   （Vite + React + TS + MSW），作為 Skills 練習的真實程式碼基底。

> 課程講義：[deanlin.net/course/wiwynn](https://deanlin.net/course/wiwynn)

---

## 內建 Agent Skills

| Skill                | 說明                                                        |
| -------------------- | ----------------------------------------------------------- |
| `git-smart-commit`   | 將雜亂的 git 變更依功能邏輯自動拆分成多個 conventional commit |
| `git-pr-description` | 根據 branch 差異自動產生 Pull Request 的 Title 與 Description |
| `git-branch-name`    | 根據變更內容設計符合 kebab-case 命名的 feature branch        |
| `gen-test-cases`     | 根據選取的程式碼或功能範圍，自動產生測試案例與測試程式       |

`.claude/`、`.cursor/`、`.codex/`、`.gemini/`、`.github/`、`.opencode/`、`.factory/`
都是指向 `.agents/skills/` 的 symlink — 不論用哪個 AI 工具，看到的 Skill 集合一致。
新增或修改 Skill 請只動 `.agents/skills/`。

---

## 環境需求

- **Node.js** ≥ 20
- **npm**（隨 Node 附帶）
- 推薦搭配 [Claude Code](https://claude.ai/code)、Cursor、或任一支援 Skills 的 AI 工具

---

## 啟動方式

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器（http://localhost:5173，預設啟用 MSW mock 後端）
npm run dev
```

其他常用指令：

```bash
npm run build        # 生產打包到 dist/
npm run preview      # 本機預覽 build 後產物
npm run lint         # ESLint
npm run lint:fix     # ESLint 自動修復
npm test             # Jest（針對 src/skills/ 的工作坊測試）
npm run test:watch   # Jest watch mode
```

`.env.development` 預設 `VITE_USE_MSW=true`；若要關閉 mock，啟動前覆寫該環境變數即可。

> Husky 已安裝 pre-commit hook：每次 commit 會**並行**跑 `npm run lint` 與 `npm test`，
> 兩者皆通過才會建立 commit。

---

## 預設帳號（明碼，僅 MVP 用）

| 角色     | 帳號    | 密碼       | 權限                                |
| -------- | ------- | ---------- | ----------------------------------- |
| 管理者   | `admin` | `admin123` | 全部頁面（含員工管理）+ 全部修改歷史 |
| 一般使用者 | `user`  | `user123`  | 儀表板、車輛管理 + 自身相關修改歷史   |

---

## 路由總覽

| Path         | 守衛           | 說明                                         |
| ------------ | -------------- | -------------------------------------------- |
| `/login`     | 公開           | 登入頁；已登入者自動導向 `/`                 |
| `/`          | ProtectedRoute | 儀表板（卡片 + 圖表）                        |
| `/vehicles`  | ProtectedRoute | 車輛 CRUD（admin / user 皆可）               |
| `/employees` | AdminRoute     | 員工 CRUD（僅 admin）                        |
| `/history`   | ProtectedRoute | 修改歷史（admin / user 皆可，內容依角色過濾） |

---

## 修改歷史（Audit Log）

`/history` 紀錄 vehicle / employee 的 CUD 動作（含欄位級 diff）。幾條重點規則：

- 只有**成功的 mutation** 才寫入；失敗 / `update` 但 diff 為空都 SHALL NOT 寫入
- 角色過濾在 `/api/history` mock handler 端執行（前端不過濾）：
  - `admin` 看全部事件；`user` 看全部 vehicle 事件 + 與自己 `employeeId` 相關的 employee 事件
- audit log 為 in-memory，重新整理頁面後重置；不記讀取、不支援 rollback

完整契約（SHALL / Scenario）見 [openspec/specs/modification-history/spec.md](openspec/specs/modification-history/spec.md)。

---

## 進一步閱讀

- [CLAUDE.md](CLAUDE.md) — 給 AI 工具的架構說明（MSW 不變式、audit log 規則、ESLint 雙環境等）
- [openspec/specs/](openspec/specs/) — 當前系統的 capability 契約
- [openspec/changes/archive/](openspec/changes/archive/) — 歷史變更（含 proposal / design / tasks / spec delta）
- 後續若要新增功能 / 修改契約，建議用 OpenSpec 流程開新 change，而非直接動主 spec
