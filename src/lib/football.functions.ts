import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { discover, profileFor } from "./football/research.server";

const discoverInput = z.object({
  query: z.string().trim().max(200).nullable().default(null),
  exclude: z.array(z.string()).max(30).default([]),
});

export const discoverPlayers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => discoverInput.parse(data))
  .handler(async ({ data }) => discover(data.query, data.exclude));

const profileInput = z.object({
  latinName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(120),
  refresh: z.boolean().default(false),
});

export const getPlayerProfile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => profileInput.parse(data))
  .handler(async ({ data }) => profileFor(data));
