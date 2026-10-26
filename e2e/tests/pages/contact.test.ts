import { expect, test } from "~/e2e/lib/test";

test.use({ javaScriptEnabled: false });

test("contact form renders its fields and an initially empty status without JavaScript", async ({
	page,
	createI18n,
}) => {
	const { t } = await createI18n();
	await page.goto("/kontakt");
	await expect(
		page.getByRole("textbox", { name: `${t("ContactPage.form.name")} *`, exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("textbox", { name: `${t("ContactPage.form.email")} *`, exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("textbox", { name: `${t("ContactPage.form.subject")} *`, exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("textbox", { name: `${t("ContactPage.form.message")} *`, exact: true }),
	).toBeVisible();
	await expect(page.getByRole("button", { name: t("ContactPage.form.submit") })).toBeVisible();
	await expect(page.locator('[aria-live="polite"]')).toBeEmpty();
});

test("invalid contact submissions render the translated error without sending mail", async ({
	page,
	createI18n,
}) => {
	const { t } = await createI18n();
	// Bypass browser validation to exercise server validation; the invalid sender address fails before delivery.
	const response = await page.request.post("/kontakt", {
		form: { name: "Test", email: "invalid", subject: "Question", message: "Hello" },
	});
	expect(response.ok()).toBe(true);
	await page.setContent(await response.text());
	await expect(page.locator('[aria-live="polite"]')).toHaveText(
		t("ContactPage.form.invalid-input"),
	);
	await expect(page.locator('[aria-live="polite"]')).toHaveClass(/text-negative-600/);
});
