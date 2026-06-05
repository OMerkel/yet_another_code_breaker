import { describe, expect, it } from "vitest";
import {
	CODE_LENGTH_OPTIONS,
	DEFAULT_SETTINGS,
	formatDuration,
	getAvailableSymbols,
	getSymbolCatalog,
	MAX_ATTEMPTS_OPTIONS,
	mulberry32,
	normalizeSettings,
	SYMBOL_COUNT_OPTIONS,
	shuffle,
	valuesToDisplay,
} from "../../js/common.js";

describe("common configuration", () => {
	it("exposes supported option ranges", () => {
		expect(CODE_LENGTH_OPTIONS).toEqual([4, 5]);
		expect(SYMBOL_COUNT_OPTIONS).toEqual([6, 7, 8, 9, 10]);
		expect(MAX_ATTEMPTS_OPTIONS).toEqual([8, 10, 12, null]);
		expect(DEFAULT_SETTINGS).toEqual({
			codeLength: 4,
			symbolCount: 6,
			representation: "colors",
			maxAttempts: 8,
		});
	});

	it("normalizes invalid settings back to defaults", () => {
		expect(
			normalizeSettings({
				codeLength: 8,
				symbolCount: 12,
				representation: "unknown",
				maxAttempts: 99,
			}),
		).toEqual(DEFAULT_SETTINGS);
	});

	it("supports unlimited attempts and alternate representations", () => {
		expect(
			normalizeSettings({
				codeLength: "5",
				symbolCount: "10",
				representation: "letters",
				maxAttempts: "unlimited",
			}),
		).toEqual({
			codeLength: 5,
			symbolCount: 10,
			representation: "letters",
			maxAttempts: null,
		});
	});
});

describe("mulberry32", () => {
	it("produces deterministic sequence for same seed", () => {
		const a = mulberry32(123456);
		const b = mulberry32(123456);
		expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()]);
	});

	it("produces values in [0, 1)", () => {
		const rnd = mulberry32(77);
		for (let index = 0; index < 25; index += 1) {
			const value = rnd();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});
});

describe("shuffle", () => {
	it("returns new array with same values", () => {
		const data = [1, 2, 3, 4, 5];
		const out = shuffle(data, mulberry32(5));
		expect(out).not.toBe(data);
		expect([...out].sort((x, y) => x - y)).toEqual(data);
	});

	it("can keep order when random function always returns 0", () => {
		const data = [1, 2, 3, 4];
		expect(shuffle(data, () => 0)).toEqual([2, 3, 4, 1]);
	});
});

describe("valuesToDisplay", () => {
	it("maps number values to display tokens", () => {
		expect(
			valuesToDisplay([0, 5], DEFAULT_SETTINGS).map((item) => item.text),
		).toEqual(["A", "Y"]);
	});

	it("maps colors to color metadata", () => {
		const output = valuesToDisplay([0, 2], {
			...DEFAULT_SETTINGS,
			representation: "colors",
			symbolCount: 6,
		});
		expect(output[0]).toMatchObject({ kind: "color", label: "Amber" });
		expect(output[1]).toMatchObject({ kind: "color", label: "Emerald" });
	});

	it("returns null when a value is outside the active symbol range", () => {
		expect(valuesToDisplay([0, 9], DEFAULT_SETTINGS)).toEqual([
			expect.objectContaining({ text: "A" }),
			null,
		]);
	});
});

describe("symbol catalogs", () => {
	it("builds letter, color, symbol, and default catalogs", () => {
		expect(getSymbolCatalog("letters")[0]).toMatchObject({
			kind: "text",
			text: "A",
		});
		expect(getSymbolCatalog("colors")[0]).toMatchObject({
			kind: "color",
			label: "Amber",
		});
		expect(getSymbolCatalog("symbols")[0]).toMatchObject({ kind: "symbol" });
		expect(getSymbolCatalog("unknown")[0]).toMatchObject({
			kind: "text",
			text: "1",
		});
	});

	it("returns only the configured subset of available symbols", () => {
		expect(
			getAvailableSymbols({ representation: "letters", symbolCount: 4 }),
		).toHaveLength(4);
		expect(
			getAvailableSymbols({ representation: "letters", symbolCount: 4 })[3],
		).toMatchObject({ text: "D" });
	});
});

describe("formatDuration", () => {
	it("formats minutes and seconds", () => {
		expect(formatDuration(125)).toBe("2:05");
	});

	it("returns dash for invalid durations", () => {
		expect(formatDuration(-1)).toBe("-");
		expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("-");
	});
});
