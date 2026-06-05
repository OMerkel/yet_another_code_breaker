// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

export const CODE_LENGTH_OPTIONS = Object.freeze([4, 5]);
export const SYMBOL_COUNT_OPTIONS = Object.freeze([6, 7, 8, 9, 10]);
export const REPRESENTATION_OPTIONS = Object.freeze([
	"numbers",
	"colors",
	"letters",
	"symbols",
]);
export const MAX_ATTEMPTS_OPTIONS = Object.freeze([8, 10, 12, null]);

export const NUMBER_SYMBOLS = Object.freeze([
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"0",
]);

export const LETTER_SYMBOLS = Object.freeze([
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
]);

export const COLOR_SYMBOLS = Object.freeze([
	{ label: "Amber", token: "#d97706", text: "A" },
	{ label: "Blue", token: "#2855d5", text: "B" },
	{ label: "Emerald", token: "#059669", text: "E" },
	{ label: "Rose", token: "#ec4899", text: "R" },
	{ label: "Yellow", token: "#ffee00", text: "W" },
	{ label: "Cyan", token: "#38bdf8", text: "Y" },
	{ label: "Forest", token: "#22c55e", text: "F" },
	{ label: "Indigo", token: "#818cf8", text: "I" },
	{ label: "Lime", token: "#a3e635", text: "L" },
	{ label: "Slate", token: "#64748b", text: "S" },
]);

export const EMOJI_SYMBOLS = Object.freeze([
	"◆",
	"●",
	"■",
	"▲",
	"★",
	"☀",
	"☂",
	"☘",
	"☕",
	"♫",
]);

export const DEFAULT_SETTINGS = Object.freeze({
	codeLength: 4,
	symbolCount: 6,
	representation: "colors",
	maxAttempts: 8,
});

export const pad2 = (value) => String(value).padStart(2, "0");

export const mulberry32 = (seed) => {
	let current = seed >>> 0;
	return () => {
		current += 0x6d2b79f5;
		let next = Math.imul(current ^ (current >>> 15), 1 | current);
		next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
		return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
	};
};

export const randomInt = (random, maxExclusive) =>
	Math.floor(random() * maxExclusive);

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const shuffle = (values, randomFn) => {
	const next = [...values];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(randomFn() * (index + 1));
		[next[index], next[swapIndex]] = [next[swapIndex], next[index]];
	}
	return next;
};

export const normalizeMaxAttempts = (value) =>
	value === null || value === "unlimited"
		? null
		: Number.parseInt(String(value), 10);

export const normalizeSettings = (input = {}) => {
	const codeLength = CODE_LENGTH_OPTIONS.includes(Number(input.codeLength))
		? Number(input.codeLength)
		: DEFAULT_SETTINGS.codeLength;
	const symbolCount = SYMBOL_COUNT_OPTIONS.includes(Number(input.symbolCount))
		? Number(input.symbolCount)
		: DEFAULT_SETTINGS.symbolCount;
	const representation = REPRESENTATION_OPTIONS.includes(input.representation)
		? input.representation
		: DEFAULT_SETTINGS.representation;
	const rawMaxAttempts = Object.hasOwn(input, "maxAttempts")
		? input.maxAttempts
		: DEFAULT_SETTINGS.maxAttempts;
	const maxAttemptsValue = normalizeMaxAttempts(rawMaxAttempts);
	const maxAttempts = MAX_ATTEMPTS_OPTIONS.includes(maxAttemptsValue)
		? maxAttemptsValue
		: DEFAULT_SETTINGS.maxAttempts;

	return {
		codeLength,
		symbolCount,
		representation,
		maxAttempts,
	};
};

export const getSymbolCatalog = (representation) => {
	switch (representation) {
		case "letters":
			return LETTER_SYMBOLS.map((label, value) => ({
				value,
				label,
				text: label,
				kind: "text",
			}));
		case "colors":
			return COLOR_SYMBOLS.map((item, value) => ({
				value,
				label: item.label,
				text: item.text,
				kind: "color",
				color: item.token,
			}));
		case "symbols":
			return EMOJI_SYMBOLS.map((label, value) => ({
				value,
				label,
				text: label,
				kind: "symbol",
			}));
		default:
			return NUMBER_SYMBOLS.map((label, value) => ({
				value,
				label,
				text: label,
				kind: "text",
			}));
	}
};

export const getAvailableSymbols = (settings) =>
	getSymbolCatalog(settings.representation).slice(0, settings.symbolCount);

export const valuesToDisplay = (values, settings) => {
	const catalog = getAvailableSymbols(settings);
	const byValue = new Map(catalog.map((item) => [item.value, item]));
	return values.map((value) => byValue.get(value) ?? null);
};

export const formatDuration = (seconds) => {
	if (!Number.isFinite(seconds) || seconds < 0) return "-";
	const minutes = Math.floor(seconds / 60);
	return `${minutes}:${pad2(seconds % 60)}`;
};
