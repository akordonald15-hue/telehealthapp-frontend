import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// The API client refuses to load without a base URL, and jsdom has no clipboard or share.
process.env.NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost/api/v1";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
