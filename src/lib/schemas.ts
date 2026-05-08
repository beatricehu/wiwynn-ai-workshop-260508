import { z } from "zod";

// ---------- Auth ----------

export const loginSchema = z.object({
  username: z.string().min(1, "必填"),
  password: z.string().min(1, "必填"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const userRoleSchema = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: userRoleSchema,
  employeeId: z.string().optional(),
});
export type User = z.infer<typeof userSchema>;

// ---------- Vehicle ----------

export const vehicleStatusSchema = z.enum(["available", "in-use", "maintenance"]);
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;

export const vehicleInputSchema = z.object({
  plateNo: z.string().min(1, "必填").max(20),
  brand: z.string().min(1, "必填").max(50),
  model: z.string().min(1, "必填").max(50),
  year: z.coerce
    .number()
    .int("必須為整數")
    .min(1900, "年份過早")
    .max(2100, "年份過晚"),
  status: vehicleStatusSchema,
  assignedTo: z.string().max(50).optional().or(z.literal("")),
});
export type VehicleInput = z.infer<typeof vehicleInputSchema>;

export const vehicleSchema = vehicleInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

// ---------- Employee ----------

export const employeeInputSchema = z.object({
  name: z.string().min(1, "必填").max(50),
  email: z.string().email("請輸入有效的 email"),
  department: z.string().min(1, "必填").max(50),
  role: z.string().min(1, "必填").max(50),
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "格式須為 YYYY-MM-DD"),
});
export type EmployeeInput = z.infer<typeof employeeInputSchema>;

export const employeeSchema = employeeInputSchema.extend({
  id: z.string(),
});
export type Employee = z.infer<typeof employeeSchema>;

// ---------- Audit / Modification History ----------

export const auditResourceSchema = z.enum(["vehicle", "employee"]);
export type AuditResource = z.infer<typeof auditResourceSchema>;

export const auditActionSchema = z.enum(["create", "update", "delete"]);
export type AuditAction = z.infer<typeof auditActionSchema>;

export type AuditChange = {
  field: string;
  from: unknown;
  to: unknown;
};

export type AuditEvent = {
  id: string;
  resource: AuditResource;
  resourceId: string;
  resourceLabel: string;
  action: AuditAction;
  actor: { userId: string; username: string; role: UserRole };
  changes?: AuditChange[];
  createdAt: string;
};

// ---------- API Errors ----------

export type ApiError = {
  message: string;
  field?: string;
};
