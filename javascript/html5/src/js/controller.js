// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import { applyAction, Board, createBoard } from "./board.js";
import { DEFAULT_SETTINGS, normalizeSettings } from "./common.js";

let settings = DEFAULT_SETTINGS;
let board = new Board(createBoard({ settings }));

const snapshot = () => ({ board: board.getState() });

const postState = (request) => {
	self.postMessage({
		eventClass: "request",
		request,
		...snapshot(),
	});
};

const postTurnReady = () => {
	postState("redraw");
	postState("human_to_move");
};

const applySettings = (payload = {}) => {
	settings = normalizeSettings({ ...settings, ...payload });
	return settings;
};

const restart = (payload = {}) => {
	applySettings(payload);
	board = new Board(createBoard({ settings }));
	postTurnReady();
};

const move = (action, payload = {}) => {
	applySettings(payload);
	board.setState(applyAction(board.getState(), action));
	postTurnReady();
};

const sync = (payload = {}) => {
	applySettings(payload);
	postTurnReady();
};

const handlers = Object.freeze({
	start: ({ settings: payload }) => restart(payload),
	restart: ({ settings: payload }) => restart(payload),
	move: ({ settings: payload, action }) => move(action, payload),
	sync: ({ settings: payload }) => sync(payload),
	action_by_ai: ({ settings: payload }) => sync(payload),
});

self.addEventListener("message", ({ data }) => {
	const handler = handlers[data.request];
	if (handler) {
		handler(data);
	}
});
