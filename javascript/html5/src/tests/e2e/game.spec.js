import { expect, test } from "@playwright/test";

test.describe("Yet Another Code Breaker app shell", () => {
	test("loads game view by default", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/Yet Another Code Breaker/i);
		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator("#app-header-title")).toContainText(
			"Yet Another Code Breaker",
		);
		await expect(page.locator("#board .game-layout")).toBeVisible();
	});

	test("menu navigation switches views", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-rules").click();
		await expect(page.locator("#view-rules")).toBeVisible();

		await page.locator("#btn-menu").click();
		await page.locator("#nav-about").click();
		await expect(page.locator("#view-about")).toBeVisible();

		await page.locator("#view-about .btn-back").click();
		await expect(page.locator("#view-game")).toBeVisible();
	});
});

test.describe("Options and settings", () => {
	test("can switch code length and representation", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		await page.locator('input[name="codeLength"][value="5"]').check();
		await page.locator('input[name="representation"][value="letters"]').check();
		await page.locator("#btn-options-ok").click();

		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator("#app-header-badge")).toContainText("5x6");
		await expect(page.locator("#app-header-badge")).toContainText("letters");
		await expect(page.locator("#board .current-row .symbol-cell")).toHaveCount(
			5,
		);
	});

	test("submits a guess and records feedback", async ({ page }) => {
		await page.goto("/");
		const keys = page.locator('[data-input-action="append"]');
		await keys.nth(0).click();
		await keys.nth(1).click();
		await keys.nth(2).click();
		await keys.nth(3).click();
		await page.locator('[data-input-action="submit"]').click();

		await expect(page.locator(".history-item")).toHaveCount(1);
		await expect(page.locator(".feedback-badge").first()).toBeVisible();
	});
});

test.describe("Highscore reset confirmation", () => {
	test("today reset asks for confirmation and can be cancelled", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.dismiss();
		});

		await page.locator("#btn-reset-score-today").click();
		await expect(page.locator("#score-today")).toBeVisible();
	});

	test("week reset asks for confirmation and can be accepted", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.accept();
		});

		await page.locator("#btn-reset-score-week").click();
		await expect(page.locator("#score-week")).toBeVisible();
	});

	test("month reset asks for confirmation and can be accepted", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.accept();
		});

		await page.locator("#btn-reset-score-month").click();
		await expect(page.locator("#score-month")).toBeVisible();
	});
});
