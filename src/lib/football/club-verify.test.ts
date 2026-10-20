/// <reference types="bun" />
import { afterEach, expect, test } from "bun:test";
import { cacheDrop, cached } from "./cache.server";
import { verifyCurrentClub, type ClubSourceProvider, type Query } from "./club-verify.server";

afterEach(() => cacheDrop(""));

test("fresh verification replaces an unexpired cached club immediately", async () => {
  const query: Query = { latinName: "Test Player", birthDate: "1990-01-01", nationality: null, club: "النادي السابق" };
  let club = "النادي السابق";
  let calls = 0;
  const provider: ClubSourceProvider = {
    id: "test", label: "test", reliability: 1,
    async observe() {
      calls++;
      return { playerId: "1", name: query.latinName, club, teamId: null, logo: null,
        birthDate: query.birthDate, nationality: null, previousClub: query.club,
        since: null, transferState: "PERMANENT", retired: false };
    },
  };
  expect((await verifyCurrentClub(query, [provider])).status).toBe("confirmed");
  club = "النادي الجديد";
  expect((await verifyCurrentClub(query, [provider])).status).toBe("confirmed");
  const fresh = await verifyCurrentClub({ ...query, refresh: true }, [provider]);
  expect(fresh.status).toBe("changed");
  if (fresh.status === "unavailable") throw new Error("Expected verified club");
  expect(fresh.name).toBe("النادي الجديد");
  expect(calls).toBe(2);
  provider.observe = async () => null;
  const fallback = await verifyCurrentClub({ ...query, refresh: true }, [provider]);
  expect(fallback.status).toBe("changed");
  if (fallback.status === "unavailable") throw new Error("Expected last verified club");
  expect(fallback.name).toBe("النادي الجديد");
  expect(fallback.state).toBe("STALE");
});

test("fresh cache reads bypass TTL while concurrent requests share work", async () => {
  await cached("hl:test", 120000, async () => "old headlines");
  let calls = 0;
  let finish: (value: string) => void = () => {};
  const work = () => { calls++; return new Promise<string>((resolve) => { finish = resolve; }); };
  const first = cached("hl:test", 120000, work, true);
  const second = cached("hl:test", 120000, work, true);
  finish("fresh headlines");
  expect(await first).toBe("fresh headlines");
  expect(await second).toBe("fresh headlines");
  expect(calls).toBe(1);
  expect(await cached("hl:test", 120000, async () => "unexpected")).toBe("fresh headlines");
});
function newsObs(lineupConfirmed: boolean, outlets = 2) {
  return {
    playerId: "n", name: "Test Striker", club: "النادي الجديد", teamId: null, logo: null,
    birthDate: null, nationality: null, previousClub: "النادي القديم", since: null,
    transferState: "PERMANENT" as const, retired: false,
    evidence: { outlets, lineup: false, official: true, headlines: ["x"], lineupConfirmed,
      items: [{ title: "x", url: "https://a", source: "A", publishedAt: null, kind: "official" as const }] },
  };
}
const nq: Query = { latinName: "Test Striker", club: "النادي القديم", nationality: null, birthDate: null, refresh: true };

test("news + club line-up naming the player changes the club and is confirmed today", async () => {
  const r = await verifyCurrentClub(nq, [{ id: "news", label: "news", reliability: 0.7, observe: async () => newsObs(true) }]);
  expect(r.status).toBe("changed");
  if (r.status === "unavailable") throw new Error();
  expect(r.name).toBe("النادي الجديد");
  expect(r.proof).toBe("confirmed_today");
  expect(r.evidence?.length).toBe(1);
});

test("news without a line-up does not change the club", async () => {
  const r = await verifyCurrentClub({ ...nq, latinName: "Test Striker" }, [{ id: "news", label: "news", reliability: 0.7, observe: async () => newsObs(false) }]);
  expect(r.status === "unavailable" || !r.changed).toBe(true);
});
