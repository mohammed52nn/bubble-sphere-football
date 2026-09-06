import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ProviderError, playerLiveInfo } from "./football/provider.server";
import type { LiveResponse } from "./football/live-types";

const input = z.object({
  latinName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(120),
  club: z.string().trim().max(120).nullable().default(null),
});

/**
 * Stable contract: { ok: true, data } | { ok: false, error }.
 * Provider secrets and stack traces never reach the client.
 */
export const getPlayerLiveInfo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<LiveResponse> => {
    const fetchedAtUtc = new Date().toISOString();
    try {
      return { ok: true, data: await playerLiveInfo(data), fetchedAtUtc };
    } catch (error) {
      if (error instanceof ProviderError) {
        return {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            retryAfterMs: error.retryAfterMs,
          },
          fetchedAtUtc,
        };
      }
      console.warn("[live] unexpected failure");
      return {
        ok: false,
        error: { code: "UPSTREAM_ERROR", message: "unexpected failure" },
        fetchedAtUtc,
      };
    }
  });
