import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyCurrentClub } from "./football/club-verify.server";
import type { ClubVerification } from "./football/club-types";

const input = z.object({
  latinName: z.string().trim().min(1).max(120),
  club: z.string().trim().max(120).nullable().default(null),
  nationality: z.string().trim().max(120).nullable().default(null),
  birthDate: z
    .string()
    .trim()
    .nullable()
    .default(null)
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)),
  debug: z.boolean().default(false),
});

export const verifyPlayerClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<ClubVerification> => {
    try {
      const { debug, ...q } = data;
      const result = await verifyCurrentClub(q);
      if (!debug) {
        const { debug: _omit, ...rest } = result;
        return rest as ClubVerification;
      }
      return result;
    } catch {
      return { status: "unavailable" };
    }
  });
