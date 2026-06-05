import { describe, expect, it } from "vitest";
import {
	applyAction,
	Board,
	canSubmitGuess,
	createBoard,
	GAME_STATUS,
	getElapsedSeconds,
	getHighscoreEntry,
	INPUT_ACTIONS,
	isHighscoreEligible,
	isValidValue,
	scoreGuess,
	submitGuess,
	withSecret,
} from "../../js/board.js";

const withGuess = (board, guess, now = 1000) =>
	guess.reduce(
		(state, value, index) =>
			applyAction(state, { type: INPUT_ACTIONS.APPEND, value }, now + index),
		board,
	);

describe("createBoard", () => {
	it("creates deterministic secret for a fixed seed", () => {
		const a = createBoard({ seed: 123 });
		const b = createBoard({ seed: 123 });
		expect(a.secret).toEqual(b.secret);
	});

	it("normalizes settings and builds keypad metadata", () => {
		const board = createBoard({
			settings: {
				codeLength: 5,
				symbolCount: 8,
				representation: "letters",
				maxAttempts: "unlimited",
			},
			seed: 7,
			now: 400,
		});

		expect(board.createdAt).toBe(400);
		expect(board.settings).toEqual({
			codeLength: 5,
			symbolCount: 8,
			representation: "letters",
			maxAttempts: null,
		});
		expect(board.keypad).toHaveLength(8);
		expect(board.status).toBe(GAME_STATUS.PLAYING);
		expect(board.canSubmit).toBe(false);
	});
});

describe("scoreGuess", () => {
	it("counts exact and misplaced values with duplicates", () => {
		expect(scoreGuess([1, 1, 2, 3], [1, 2, 1, 4])).toEqual({
			exact: 1,
			misplaced: 2,
		});
	});

	it("throws when guess length differs from secret length", () => {
		expect(() => scoreGuess([1, 2], [1])).toThrow(/equal length/);
	});
});

describe("input handling", () => {
	it("appends values immutably and tracks first input time", () => {
		const board = createBoard({ seed: 1, now: 10 });
		const next = applyAction(
			board,
			{ type: INPUT_ACTIONS.APPEND, value: 2 },
			55,
		);

		expect(next).not.toBe(board);
		expect(next.currentGuess).toEqual([2]);
		expect(next.firstInputAt).toBe(55);
		expect(next.currentGuessDisplay[0].text).toBe("E");
		expect(board.currentGuess).toEqual([]);
	});

	it("rejects invalid values and ignores input after the guess is full", () => {
		const board = createBoard({ seed: 1 });
		const invalid = applyAction(
			board,
			{ type: INPUT_ACTIONS.APPEND, value: 99 },
			1,
		);
		expect(invalid).toBe(board);

		const full = withGuess(board, [0, 1, 2, 3]);
		expect(canSubmitGuess(full)).toBe(true);
		expect(
			applyAction(full, { type: INPUT_ACTIONS.APPEND, value: 4 }, 99),
		).toBe(full);
	});

	it("supports backspace and clear", () => {
		const board = withGuess(createBoard({ seed: 2 }), [0, 1, 2]);
		const shorter = applyAction(board, { type: INPUT_ACTIONS.BACKSPACE });
		expect(shorter.currentGuess).toEqual([0, 1]);

		const cleared = applyAction(shorter, { type: INPUT_ACTIONS.CLEAR });
		expect(cleared.currentGuess).toEqual([]);
	});

	it("reports valid value bounds from settings", () => {
		const board = createBoard({ settings: { symbolCount: 8 } });
		expect(isValidValue(board, 0)).toBe(true);
		expect(isValidValue(board, 7)).toBe(true);
		expect(isValidValue(board, 8)).toBe(false);
	});

	it("ignores invalid action objects and unknown action types", () => {
		const board = createBoard({ seed: 9 });
		expect(applyAction(board, null)).toBe(board);
		expect(applyAction(board, "bad-action")).toBe(board);
		expect(applyAction(board, { type: "mystery" })).toBe(board);
	});

	it("returns the same board when backspace or clear are used on an empty guess", () => {
		const board = createBoard({ seed: 12 });
		expect(applyAction(board, { type: INPUT_ACTIONS.BACKSPACE })).toBe(board);
		expect(applyAction(board, { type: INPUT_ACTIONS.CLEAR })).toBe(board);
	});

	it("ignores editing actions after the game has been won", () => {
		const solved = submitGuess(
			withGuess(
				withSecret(createBoard({ seed: 10 }), [0, 1, 2, 3]),
				[0, 1, 2, 3],
			),
			500,
		);
		expect(applyAction(solved, { type: INPUT_ACTIONS.BACKSPACE })).toBe(solved);
		expect(applyAction(solved, { type: INPUT_ACTIONS.CLEAR })).toBe(solved);
	});
});

describe("submitGuess", () => {
	it("wins when the guess matches the secret", () => {
		const board = withSecret(createBoard({ seed: 1 }), [0, 1, 2, 3]);
		const ready = withGuess(board, [0, 1, 2, 3], 500);
		const solved = submitGuess(ready, 2600);

		expect(solved.status).toBe(GAME_STATUS.WON);
		expect(solved.animation).toBe("celebrate");
		expect(solved.finishedAt).toBe(2600);
		expect(solved.history).toHaveLength(1);
		expect(solved.history[0]).toMatchObject({ exact: 4, misplaced: 0 });
		expect(solved.currentGuess).toEqual([]);
		expect(solved.message).toMatch(/Solved in 1 attempt/);
	});

	it("loses when the attempt limit is reached without solving", () => {
		let board = withSecret(
			createBoard({ settings: { maxAttempts: 8 }, seed: 2 }),
			[0, 1, 2, 3],
		);

		for (let attempt = 0; attempt < 8; attempt += 1) {
			board = withGuess(board, [3, 3, 3, 3], 1000 + attempt * 10);
			board = submitGuess(board, 2000 + attempt * 10);
		}

		expect(board.status).toBe(GAME_STATUS.LOST);
		expect(board.animation).toBe("tilt");
		expect(board.history).toHaveLength(8);
		expect(board.attemptsRemaining).toBe(0);
		expect(board.message).toMatch(/No attempts left/);
	});

	it("stays in play when attempts remain", () => {
		const board = withSecret(createBoard({ seed: 3 }), [0, 1, 2, 3]);
		const ready = withGuess(board, [0, 3, 2, 1], 100);
		const next = submitGuess(ready, 600);

		expect(next.status).toBe(GAME_STATUS.PLAYING);
		expect(next.animation).toBe("idle");
		expect(next.history[0]).toMatchObject({ exact: 2, misplaced: 2 });
		expect(next.currentGuess).toEqual([]);
		expect(next.attemptsRemaining).toBe(7);
	});

	it("returns the same board when submit is not allowed", () => {
		const board = createBoard({ seed: 4 });
		expect(submitGuess(board, 200)).toBe(board);
	});

	it("supports submit through applyAction", () => {
		const board = withSecret(createBoard({ seed: 13 }), [0, 1, 2, 3]);
		const ready = withGuess(board, [0, 1, 2, 3], 100);
		const solved = applyAction(ready, { type: INPUT_ACTIONS.SUBMIT }, 900);
		expect(solved.status).toBe(GAME_STATUS.WON);
		expect(solved.finishedAt).toBe(900);
	});
});

describe("highscore helpers", () => {
	it("returns elapsed seconds and highscore entry for wins", () => {
		const board = withSecret(createBoard({ seed: 5 }), [0, 1, 2, 3]);
		const ready = withGuess(board, [0, 1, 2, 3], 1000);
		const solved = submitGuess(ready, 4500);

		expect(getElapsedSeconds(solved, 5000)).toBe(3);
		expect(isHighscoreEligible(solved)).toBe(true);
		expect(getHighscoreEntry(solved, 5000)).toEqual({
			attempts: 1,
			seconds: 3,
			codeLength: 4,
			symbolCount: 6,
			representation: "colors",
			maxAttempts: 8,
		});
	});

	it("returns null for unfinished games", () => {
		const board = createBoard({ seed: 6 });
		expect(getElapsedSeconds(board, 5000)).toBe(0);
		expect(isHighscoreEligible(board)).toBe(false);
		expect(getHighscoreEntry(board, 5000)).toBeNull();
	});

	it("uses the current time when the game is still active", () => {
		const board = withGuess(createBoard({ seed: 11 }), [0], 1000);
		expect(getElapsedSeconds(board, 3900)).toBe(2);
	});
});

describe("Board class adapter", () => {
	it("stores and replaces state", () => {
		const board = new Board(createBoard({ seed: 7 }));
		const next = withSecret(board.getState(), [0, 1, 2, 3]);
		board.setState(next);
		expect(board.getState()).toBe(next);
	});

	it("rejects invalid secrets", () => {
		const board = createBoard({ seed: 8 });
		expect(() => withSecret(board, [0, 1])).toThrow(/code length/);
		expect(() => withSecret(board, [0, 1, 2, 99])).toThrow(/invalid values/);
	});
});
