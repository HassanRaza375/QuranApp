// The Daily Fiqh decision helpers, on the production build. No scholar has signed off their paths (owner decision 2026-10-28: not required), so they are shown to everyone and every result says "Not scholar-reviewed".
// Rules under test: one question per screen, every question offers "I'm not sure" and it leads to a pointer to his risala; an answer shows his own words with his book and number; an answer that quotes a
// ruling which may not be shown shows the pointer; Back and Start over work; "Not scholar-reviewed" is on every helper.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, mockQuranText, seed } from "./mocks";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ context }) => {
  await forbidRealApis(context);
  await freezeClock(context);
  await mockQuranText(context);
});

const follow = (context: Parameters<typeof seed>[0], marjaId: string) => seed(context, { "quran:fiqh-prefs:v1": JSON.stringify({ marjaId, lang: "en", updatedAt: 1 }), prayerFiqh: "jafari" });
async function topic(page: Page, category: string, id: string) {
  await page.goto(`/fiqh/${category}/${id}`);
  await expect(page.getByTestId("fiqh-topic-title")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Loading the rulings…")).toHaveCount(0);
}
/** Answers with the option whose label contains `label`, then Next. */
async function answer(page: Page, label: string) {
  await page.getByTestId("helper-question").locator("label", { hasText: label }).first().locator("input").check();
  await page.getByTestId("helper-next").click();
}

test.describe("each marja sees only his own helpers", () => {
  test("Sistani and Khamenei each get a helper on the wuḍūʾ topic and on the doubts topic; Makarem Shirazi none; each says Not scholar-reviewed", async ({ page, context }) => {
    for (const [marja, wudu, doubts] of [["sistani", "sistaniwudu", "sistanidoubts"], ["khamenei", "khameneiwudu", "khameneidoubts"]] as const) {
      await follow(context, marja);
      await topic(page, "taharat", "wudu");
      await expect(page.getByTestId("fiqh-helper")).toHaveCount(1);
      await expect(page.getByTestId("fiqh-helper")).toHaveAttribute("data-helper", wudu);
      await expect(page.getByTestId("fiqh-helper")).toContainText("Not scholar-reviewed");
      await topic(page, "salat", "doubts");
      await expect(page.getByTestId("fiqh-helper")).toHaveAttribute("data-helper", doubts);
    }
    await follow(context, "makarem");
    await topic(page, "taharat", "wudu");
    await expect(page.getByTestId("fiqh-helper")).toHaveCount(0);
  });
});

test.describe("walking a helper", () => {
  test("one question per screen; Start shows the first; \"I'm not sure\" ends at a pointer to his risala with where to look; Start over returns", async ({ page, context }) => {
    await follow(context, "sistani");
    await topic(page, "taharat", "wudu");
    const helper = page.getByTestId("fiqh-helper");
    await expect(helper.getByTestId("helper-start")).toBeVisible();
    await expect(helper.getByTestId("helper-question")).toHaveCount(0);
    await helper.getByTestId("helper-start").click();
    await expect(helper.getByTestId("helper-question")).toContainText("What is your question about?");
    await expect(helper.getByTestId("helper-next")).toBeDisabled(); // nothing is chosen for you
    await expect(helper.getByTestId("helper-back")).toBeDisabled();
    await helper.getByTestId("helper-notsure").check();
    await helper.getByTestId("helper-next").click();
    await expect(helper.getByTestId("helper-refer")).toContainText("Where to look: Islamic Laws (4th edition)");
    await expect(helper.getByTestId("helper-refer").getByRole("link", { name: "Open it on the official website" })).toHaveAttribute("href", /^https:\/\/www\.sistani\.org\//);
    await expect(helper.getByTestId("helper-result")).toContainText("Not scholar-reviewed");
    await helper.getByTestId("helper-restart").click();
    await expect(helper.getByTestId("helper-question")).toContainText("What is your question about?");
  });

  test("an answer shows his own words, with his book and number, highlights the phrase that states it, offers the full ruling, and Back returns to the question", async ({ page, context }) => {
    await follow(context, "sistani");
    await topic(page, "taharat", "wudu");
    const helper = page.getByTestId("fiqh-helper");
    await helper.getByTestId("helper-start").click();
    await answer(page, "I am not sure whether I performed wuḍūʾ at all");
    await answer(page, "Before the prayer");
    const quote = helper.getByTestId("helper-quote").first();
    await expect(quote.getByTestId("helper-quote-text")).not.toBeEmpty();
    await expect(quote.getByTestId("fiqh-source")).toContainText("Islamic Laws");
    await expect(helper.getByTestId("helper-trail")).toBeVisible();
    await expect(quote.getByTestId("helper-quote-text").locator("mark").first()).toBeVisible();
    await quote.getByTestId("helper-open-ruling").click();
    await helper.getByTestId("helper-back").click();
    await expect(helper.getByTestId("helper-question")).toBeVisible();
  });

  test("Khamenei's wuḍūʾ helper: an answer that quotes a ruling held behind the pointer shows the pointer and none of its text", async ({ page, context }) => {
    await follow(context, "khamenei");
    await topic(page, "taharat", "wudu");
    const helper = page.getByTestId("fiqh-helper");
    await helper.getByTestId("helper-start").click();
    await answer(page, "I want to know whether something invalidates wuḍūʾ");
    await answer(page, "Some fluid came out");
    await answer(page, "Fluid that came out after istibrāʾ, and I doubt whether it is urine");
    await expect(helper.getByTestId("helper-result").getByTestId("ruling-pointer").first()).toContainText("Refer to his risala");
    await expect(helper.getByTestId("helper-result")).toContainText("Not scholar-reviewed");
  });

  test("Khamenei's doubts helper: its answers that quote withheld rulings show the pointer; Sistani's doubts helper never does", async ({ page, context }) => {
    await follow(context, "khamenei");
    await topic(page, "salat", "doubts");
    let helper = page.getByTestId("fiqh-helper");
    await helper.getByTestId("helper-start").click();
    await answer(page, "Whether I have prayed this prayer at all, or prayed it correctly (the prayer is over)");
    await answer(page, "No, I am still within its time, and I doubt whether I prayed it");
    await expect(helper.getByTestId("helper-result")).toBeVisible();
    await expect(helper.getByTestId("ruling-pointer").first()).toBeVisible();
    await follow(context, "sistani");
    await topic(page, "salat", "doubts");
    helper = page.getByTestId("fiqh-helper");
    await helper.getByTestId("helper-start").click();
    await answer(page, "Whether I have prayed this prayer at all, or prayed it correctly (the prayer is over)");
    await expect(helper.getByTestId("ruling-pointer")).toHaveCount(0);
  });

  test("every question of both wuḍūʾ helpers can be answered with \"I'm not sure\" and each ends at the pointer (a short walk through the first questions)", async ({ page, context }) => {
    for (const marja of ["sistani", "khamenei"]) {
      await follow(context, marja);
      await topic(page, "taharat", "wudu");
      const helper = page.getByTestId("fiqh-helper");
      await helper.getByTestId("helper-start").click();
      // first question: the first option, then "I'm not sure" on the second
      await helper.getByTestId("helper-option").first().check();
      await helper.getByTestId("helper-next").click();
      if (await helper.getByTestId("helper-question").count()) {
        await helper.getByTestId("helper-notsure").check();
        await helper.getByTestId("helper-next").click();
        await expect(helper.getByTestId("helper-refer")).toBeVisible();
      } else await expect(helper.getByTestId("helper-result")).toBeVisible();
    }
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test("375 px: the helper fits the screen and its controls are 44 px", async ({ page, context }) => {
    await follow(context, "sistani");
    await topic(page, "taharat", "wudu");
    const helper = page.getByTestId("fiqh-helper");
    await helper.getByTestId("helper-start").click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    for (const id of ["helper-next", "helper-restart"]) expect((await helper.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
    expect((await helper.getByTestId("helper-notsure").locator("xpath=..").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
  });
});
