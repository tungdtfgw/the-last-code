// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ApiResult, Ranking } from "../account/account-api";
import { RankingScreen, type RankingScreenProps } from "./ranking-screen";

afterEach(cleanup);

const ok = <T,>(data: T): ApiResult<T> => ({ ok: true, status: 200, data });

function show(ranking: ApiResult<Ranking> | ApiResult<Ranking>[], props: Partial<RankingScreenProps> = {}) {
  const answers = Array.isArray(ranking) ? [...ranking] : [ranking];
  const getRanking = vi.fn(async () => (answers.length > 1 ? answers.shift()! : answers[0]));
  const adminSetRankingHidden = vi.fn(async () => ok({ ok: true as const }));
  render(
    <RankingScreen
      api={{ getRanking, adminSetRankingHidden }}
      userId="u-me"
      username="me_too"
      isAdmin={false}
      levelLabel={(id) => (id === "1.4" ? "1.4 · Tín hiệu lệch pha" : id)}
      onBack={() => {}}
      {...props}
    />,
  );
  return { getRanking, adminSetRankingHidden };
}

const top = (n: number) => Array.from({ length: n }, (_, i) => ({ rank: i + 1, username: `p${i + 1}`, levelId: "1.4", stars: 3, me: false }));

test("a player outside the list gets their own row after a gap, with their name and level", async () => {
  show(ok({ total: 60, entries: top(2), me: { rank: 57, levelId: "1.2", stars: 1 } }));
  const mine = await screen.findByText("57");
  const row = mine.closest("tr")!;
  expect(row.getAttribute("data-me")).toBe("true");
  expect(within(row).getByText("me_too")).toBeTruthy();
  expect(within(row).getByText("1.2")).toBeTruthy();
  expect(screen.getByText("…")).toBeTruthy();
  expect(screen.getAllByText("1.4 · Tín hiệu lệch pha")).toHaveLength(2);
});

test("a player with no level yet is told how to get on the board", async () => {
  show(ok({ total: 2, entries: top(2), me: null }));
  expect(await screen.findByText("Bạn chưa có hạng.")).toBeTruthy();
  expect(screen.queryByText("…")).toBeNull();
});

test("a network failure offers THỬ LẠI, which loads again", async () => {
  const { getRanking } = show([{ ok: false, status: 0, error: "network" }, ok({ total: 0, entries: [], me: null })]);
  fireEvent.click(await screen.findByRole("button", { name: "THỬ LẠI" }));
  expect(await screen.findByText("Chưa ai qua level nào.")).toBeTruthy();
  expect(getRanking).toHaveBeenCalledTimes(2);
});

test("an admin hides a player by name, then the list reloads", async () => {
  const { adminSetRankingHidden, getRanking } = show(ok({ total: 1, entries: top(1), me: null }), { isAdmin: true });
  fireEvent.click(await screen.findByRole("button", { name: "ẨN" }));
  await act(async () => {});
  expect(adminSetRankingHidden).toHaveBeenCalledWith("p1", true, { userId: "u-me" });
  expect(getRanking).toHaveBeenCalledTimes(2);
});

test("players see no admin buttons", async () => {
  show(ok({ total: 1, entries: top(1), me: null }));
  await screen.findByText("p1");
  expect(screen.queryByRole("button", { name: "ẨN" })).toBeNull();
});
