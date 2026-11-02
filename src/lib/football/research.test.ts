/// <reference types="bun" />
import { afterEach, expect, mock, test } from "bun:test";

let aiFails = false;
mock.module("./ai.server", () => ({
  NO_HALLUCINATION_RULES: "",
  AiUnavailableError: class extends Error {},
  researchJson: async () => {
    if (aiFails) throw new Error("gateway_429");
    return { nationality: "مصر", birthDate: "1992-06-15", club: "ليفربول", position: "جناح" };
  },
}));
mock.module("./wikipedia.server", () => ({
  resolvePortrait: async () => ({ image: null, imageSource: null, pageUrl: null, bio: null }),
}));
const realNews = await import("./news.server");
mock.module("./news.server", () => ({ ...realNews, fetchArticles: async () => [] }));

const { profileFor } = await import("./research.server");
const { cacheDrop } = await import("./cache.server");

afterEach(() => cacheDrop(""));

test("a failed refresh keeps the player's known details instead of wiping them", async () => {
  const args = { latinName: "Keep Player", displayName: "لاعب" };
  const first = await profileFor(args);
  expect(first.nationality).toBe("مصر");
  aiFails = true;
  const refreshed = await profileFor({ ...args, refresh: true });
  expect(refreshed.nationality).toBe("مصر");
  expect(refreshed.birthDate).toBe("1992-06-15");
  expect(refreshed.position).toBe("جناح");
});
