import { createApiClient } from "@micro/api";

export const api = createApiClient({ baseUrl: window.location.origin });
