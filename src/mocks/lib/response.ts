import { HttpResponse } from "msw";
import type { ApiError } from "@/lib/schemas";

export function errorResponse(
  status: number,
  message: string,
  field?: string,
): HttpResponse<ApiError> {
  const body: ApiError = field ? { message, field } : { message };
  return HttpResponse.json(body, { status });
}
