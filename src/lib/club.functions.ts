import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyCurrentClub } from "./football/club-verify.server";
import type { ClubVerification } from "./football/club-types";

const input = z.object({
  latinName: z.string().trim().min(1).max(120),
  club: z.string().trim().max(120).nullable().default(null),
  nationality: z.string().trim().max(120).nullable().default(null),
});

export const verifyPlayerClub = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<ClubVerification> => {
    try {
      return await verifyCurrentClub(data);
    } catch {
      return { status: "unavailable" };
    }
  });
