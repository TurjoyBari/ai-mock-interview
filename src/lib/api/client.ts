import { unwrapApiData } from "./response";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : `Request failed with status ${response.status}`;

    const retryAfterSeconds =
      typeof json === "object" &&
      json !== null &&
      "retryAfterSeconds" in json &&
      typeof (json as { retryAfterSeconds: unknown }).retryAfterSeconds ===
        "number"
        ? (json as { retryAfterSeconds: number }).retryAfterSeconds
        : undefined;

    throw new ApiClientError(message, response.status, retryAfterSeconds);
  }

  return unwrapApiData<T>(json);
}

export async function fetchApiArray<T>(
  url: string,
  init?: RequestInit
): Promise<T[]> {
  const data = await fetchApi<T[]>(url, init);
  return Array.isArray(data) ? data : [];
}
