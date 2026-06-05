// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import {
	DEFAULT_SETTINGS,
	getAvailableSymbols,
	mulberry32,
	normalizeSettings,
	randomInt,
	valuesToDisplay,
} from "./common.js";

export const GAME_STATUS = Object.freeze({
	PLAYING: "playing",
	WON: "won",
	LOST: "lost",
});

export const INPUT_ACTIONS = Object.freeze({
	APPEND: "append",
	BACKSPACE: "backspace",
	SUBMIT: "submit",
	CLEAR: "clear",
});

const defaultNow = () => Date.now();

const createSecret = (settings, seed) => {
	const random = mulberry32(seed);
	return Array.from({ length: settings.codeLength }, () =>
		randomInt(random, settings.symbolCount),
	);
};

const countValues = (values) =>
	values.reduce((counts, value) => {
		counts.set(value, (counts.get(value) ?? 0) + 1);
		return counts;
	}, new Map());

export const scoreGuess = (secret, guess) => {
	if (secret.length !== guess.length) {
		throw new Error("Secret and guess must have equal length");
	}

	const exact = secret.filter((value, index) => value === guess[index]).length;
	const secretCounts = countValues(secret);
	const guessCounts = countValues(guess);
	const shared = [...secretCounts.entries()].reduce((total, [value, count]) => {
		return total + Math.min(count, guessCounts.get(value) ?? 0);
	}, 0);

	return {
		exact,
		misplaced: shared - exact,
	};
};

const buildMessage = (board) => {
	if (board.status === GAME_STATUS.WON) {
		return `Solved in ${board.history.length} attempt${board.history.length === 1 ? "" : "s"}.`;
	}
	if (board.status === GAME_STATUS.LOST) {
		return "No attempts left. The secret code is revealed.";
	}
	if (board.currentGuess.length === board.settings.codeLength) {
		return "Press Enter to submit your guess.";
	}
	return `Enter ${board.settings.codeLength} symbols to crack the secret.`;
};

const buildResult = (guess, feedback, settings) => ({
	guess: [...guess],
	guessDisplay: valuesToDisplay(guess, settings),
	...feedback,
});

const updateDerivedState = (board) => ({
	...board,
	currentGuessDisplay: valuesToDisplay(board.currentGuess, board.settings),
	secretDisplay: valuesToDisplay(board.secret, board.settings),
	keypad: getAvailableSymbols(board.settings),
	attemptsUsed: board.history.length,
	attemptsRemaining:
		board.settings.maxAttempts === null
			? null
			: Math.max(board.settings.maxAttempts - board.history.length, 0),
	canSubmit:
		board.status === GAME_STATUS.PLAYING &&
		board.currentGuess.length === board.settings.codeLength,
	message: buildMessage(board),
});

export const createBoard = ({
	settings = DEFAULT_SETTINGS,
	seed,
	now,
} = {}) => {
	const normalizedSettings = normalizeSettings(settings);
	const resolvedSeed = Number.isInteger(seed)
		? seed
		: (Date.now() * 2654435761) >>> 0;
	const createdAt = Number.isFinite(now) ? now : defaultNow();
	return updateDerivedState({
		seed: resolvedSeed,
		createdAt,
		firstInputAt: null,
		finishedAt: null,
		status: GAME_STATUS.PLAYING,
		animation: "idle",
		settings: normalizedSettings,
		secret: createSecret(normalizedSettings, resolvedSeed),
		currentGuess: [],
		history: [],
	});
};

export class Board {
	constructor(initialState = createBoard()) {
		this.state = initialState;
	}

	getState() {
		return this.state;
	}

	setState(nextState) {
		this.state = nextState;
	}
}

export const isValidValue = (board, value) =>
	Number.isInteger(value) && value >= 0 && value < board.settings.symbolCount;

export const canSubmitGuess = (board) =>
	board.status === GAME_STATUS.PLAYING &&
	board.currentGuess.length === board.settings.codeLength;

const appendValue = (board, value, now) => {
	if (board.status !== GAME_STATUS.PLAYING) return board;
	if (!isValidValue(board, value)) return board;
	if (board.currentGuess.length >= board.settings.codeLength) return board;

	return updateDerivedState({
		...board,
		firstInputAt: board.firstInputAt ?? now,
		currentGuess: [...board.currentGuess, value],
	});
};

const backspaceValue = (board) => {
	if (board.status !== GAME_STATUS.PLAYING) return board;
	if (board.currentGuess.length === 0) return board;

	return updateDerivedState({
		...board,
		currentGuess: board.currentGuess.slice(0, -1),
	});
};

const clearGuess = (board) => {
	if (board.status !== GAME_STATUS.PLAYING) return board;
	if (board.currentGuess.length === 0) return board;
	return updateDerivedState({ ...board, currentGuess: [] });
};

export const submitGuess = (board, now = defaultNow()) => {
	if (!canSubmitGuess(board)) return board;

	const feedback = scoreGuess(board.secret, board.currentGuess);
	const nextHistory = [
		...board.history,
		buildResult(board.currentGuess, feedback, board.settings),
	];
	const isWon = feedback.exact === board.settings.codeLength;
	const reachedAttemptLimit =
		board.settings.maxAttempts !== null &&
		nextHistory.length >= board.settings.maxAttempts;
	const status = isWon
		? GAME_STATUS.WON
		: reachedAttemptLimit
			? GAME_STATUS.LOST
			: GAME_STATUS.PLAYING;

	return updateDerivedState({
		...board,
		history: nextHistory,
		currentGuess: [],
		status,
		animation: isWon
			? "celebrate"
			: status === GAME_STATUS.LOST
				? "tilt"
				: "idle",
		finishedAt: status === GAME_STATUS.PLAYING ? null : now,
	});
};

export const applyAction = (board, action, now = defaultNow()) => {
	if (!action || typeof action !== "object") return board;
	switch (action.type) {
		case INPUT_ACTIONS.APPEND:
			return appendValue(board, action.value, now);
		case INPUT_ACTIONS.BACKSPACE:
			return backspaceValue(board);
		case INPUT_ACTIONS.CLEAR:
			return clearGuess(board);
		case INPUT_ACTIONS.SUBMIT:
			return submitGuess(board, now);
		default:
			return board;
	}
};

export const getElapsedSeconds = (board, now = defaultNow()) => {
	if (!board.firstInputAt) return 0;
	const end = board.finishedAt ?? now;
	return Math.max(Math.floor((end - board.firstInputAt) / 1000), 0);
};

export const isHighscoreEligible = (board) => board.status === GAME_STATUS.WON;

export const getHighscoreEntry = (board, now = defaultNow()) => {
	if (!isHighscoreEligible(board)) return null;
	return {
		attempts: board.history.length,
		seconds: getElapsedSeconds(board, now),
		codeLength: board.settings.codeLength,
		symbolCount: board.settings.symbolCount,
		representation: board.settings.representation,
		maxAttempts: board.settings.maxAttempts,
	};
};

export const withSecret = (board, secret) => {
	if (!Array.isArray(secret) || secret.length !== board.settings.codeLength) {
		throw new Error("Secret must match code length");
	}
	const isValidSecret = secret.every(
		(value) =>
			Number.isInteger(value) &&
			value >= 0 &&
			value < board.settings.symbolCount,
	);
	if (!isValidSecret) {
		throw new Error("Secret contains invalid values");
	}
	return updateDerivedState({
		...board,
		secret: [...secret],
	});
};
