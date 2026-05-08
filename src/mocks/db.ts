import type { Employee, User, UserRole, Vehicle } from "@/lib/schemas";

// ---------- Users (帳密明碼，僅 MVP 用) ----------

export type SeedUser = User & { password: string };

export const users: SeedUser[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    role: "admin" as UserRole,
    employeeId: "e-005", // 林雅婷（人資主管）
  },
  {
    id: "2",
    username: "user",
    password: "user123",
    role: "user" as UserRole,
    employeeId: "e-001", // 張小明（業務）
  },
];

// ---------- Vehicles ----------
// createdAt 分散於近 6 個月，使儀表板趨勢圖有資料

export const vehicles: Vehicle[] = [
  {
    id: "v-001",
    plateNo: "ABC-1234",
    brand: "Toyota",
    model: "Camry",
    year: 2022,
    status: "available",
    assignedTo: "",
    createdAt: "2025-12-10T08:00:00.000Z",
  },
  {
    id: "v-002",
    plateNo: "ABC-2345",
    brand: "Honda",
    model: "Civic",
    year: 2021,
    status: "in-use",
    assignedTo: "張小明",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "v-003",
    plateNo: "ABC-3456",
    brand: "Tesla",
    model: "Model 3",
    year: 2023,
    status: "available",
    assignedTo: "",
    createdAt: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "v-004",
    plateNo: "ABC-4567",
    brand: "Ford",
    model: "Focus",
    year: 2020,
    status: "maintenance",
    assignedTo: "",
    createdAt: "2026-03-05T11:00:00.000Z",
  },
  {
    id: "v-005",
    plateNo: "ABC-5678",
    brand: "Mazda",
    model: "CX-5",
    year: 2022,
    status: "in-use",
    assignedTo: "李大華",
    createdAt: "2026-04-02T12:00:00.000Z",
  },
  {
    id: "v-006",
    plateNo: "ABC-6789",
    brand: "Hyundai",
    model: "Tucson",
    year: 2023,
    status: "available",
    assignedTo: "",
    createdAt: "2026-04-18T13:00:00.000Z",
  },
  {
    id: "v-007",
    plateNo: "ABC-7890",
    brand: "BMW",
    model: "X3",
    year: 2024,
    status: "in-use",
    assignedTo: "王美麗",
    createdAt: "2026-05-01T14:00:00.000Z",
  },
  {
    id: "v-008",
    plateNo: "ABC-8901",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: 2024,
    status: "available",
    assignedTo: "",
    createdAt: "2026-05-05T15:00:00.000Z",
  },
];

// ---------- Employees ----------

export const employees: Employee[] = [
  {
    id: "e-001",
    name: "張小明",
    email: "ming.chang@example.com",
    department: "業務部",
    role: "業務經理",
    hireDate: "2022-03-15",
  },
  {
    id: "e-002",
    name: "李大華",
    email: "dahua.li@example.com",
    department: "工程部",
    role: "資深工程師",
    hireDate: "2021-07-01",
  },
  {
    id: "e-003",
    name: "王美麗",
    email: "meili.wang@example.com",
    department: "行政部",
    role: "行政助理",
    hireDate: "2023-09-20",
  },
  {
    id: "e-004",
    name: "陳志強",
    email: "chiang.chen@example.com",
    department: "財務部",
    role: "財務專員",
    hireDate: "2020-11-10",
  },
  {
    id: "e-005",
    name: "林雅婷",
    email: "yating.lin@example.com",
    department: "人資部",
    role: "人資主管",
    hireDate: "2019-06-05",
  },
];

// ---------- ID 產生器 ----------

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}-${time}${rand}`;
}
