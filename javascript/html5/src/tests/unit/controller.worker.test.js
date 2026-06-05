import { afterEach, describe, expect, it, vi } from "vitest";

const defaultSettings = {
	codeLength: 4,
	symbolCount: 6,
	representation: "numbers",
	maxAttempts: 10,
};

afterEach(() => {
	vi.restoreAllMocks();
	vi.resetModules();
	vi.doUnmock("../../js/board.js");
	delete globalThis.self;
});

describe("controller worker message handling", () => {
	it("handles start and emits redraw + human_to_move", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({ data: { request: "start", settings: defaultSettings } });

		expect(posted.map((m) => m.request)).toEqual(["redraw", "human_to_move"]);
		expect(posted[0].board.status).toBe("playing");
		expect(posted[0].board.secret).toHaveLength(4);
		expect(posted[0].board.keypad).toHaveLength(6);
	});

	it("restarts with selected settings", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({
			data: {
				request: "restart",
				settings: {
					...defaultSettings,
					codeLength: 5,
					representation: "letters",
				},
			},
		});

		const redraw = posted.find((m) => m.request === "redraw");
		expect(redraw.board.settings.codeLength).toBe(5);
		expect(redraw.board.settings.representation).toBe("letters");
	});

	it("sync keeps board and emits turn-ready snapshot", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({ data: { request: "start", settings: defaultSettings } });
		posted.length = 0;

		onMessage({ data: { request: "sync", settings: defaultSettings } });

		expect(posted.map((m) => m.request)).toEqual(["redraw", "human_to_move"]);
	});

	it("action_by_ai remains compatibility no-op with redraw flow", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({ data: { request: "start", settings: defaultSettings } });
		posted.length = 0;

		onMessage({ data: { request: "action_by_ai", settings: defaultSettings } });

		expect(posted.map((m) => m.request)).toEqual(["redraw", "human_to_move"]);
	});

	it("move with illegal action keeps board unchanged", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({ data: { request: "start", settings: defaultSettings } });
		const before = posted[0].board;
		posted.length = 0;

		onMessage({
			data: {
				request: "move",
				settings: defaultSettings,
				action: { type: "append", value: 99 },
			},
		});

		const redraw = posted.find((m) => m.request === "redraw");
		expect(redraw.board.currentGuess).toEqual(before.currentGuess);
		expect(redraw.board.firstInputAt).toBe(before.firstInputAt);
	});

	it("invalid settings fall back to normalized defaults without crashing", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({ data: { request: "start", settings: defaultSettings } });
		posted.length = 0;

		onMessage({
			data: {
				request: "sync",
				settings: {
					...defaultSettings,
					codeLength: 99,
					representation: "bogus",
				},
			},
		});

		expect(posted.map((m) => m.request)).toEqual(["redraw", "human_to_move"]);
		expect(posted[0].board.settings.codeLength).toBe(4);
		expect(posted[0].board.settings.representation).toBe("numbers");
	});

	it("applies valid move action and updates current guess", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({ data: { request: "start", settings: defaultSettings } });
		const before = posted.find((m) => m.request === "redraw").board;
		posted.length = 0;

		onMessage({
			data: {
				request: "move",
				settings: defaultSettings,
				action: { type: "append", value: 2 },
			},
		});

		const redraw = posted.find((m) => m.request === "redraw");
		expect(redraw.board.currentGuess).toEqual([2]);
		expect(before.currentGuess).toEqual([]);
	});

	it("supports missing settings payload and unknown request safely", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({ data: { request: "start" } });
		expect(posted.map((m) => m.request)).toEqual(["redraw", "human_to_move"]);

		posted.length = 0;
		onMessage({
			data: { request: "unknown_request", settings: defaultSettings },
		});
		expect(posted).toEqual([]);
	});

	it("normalizes individual settings fields from payload", async () => {
		const posted = [];
		const listeners = new Map();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		onMessage({
			data: {
				request: "restart",
				settings: { ...defaultSettings, symbolCount: 8 },
			},
		});
		expect(
			posted.find((m) => m.request === "redraw").board.settings.symbolCount,
		).toBe(8);

		posted.length = 0;
		onMessage({
			data: {
				request: "restart",
				settings: { ...defaultSettings, symbolCount: 99 },
			},
		});
		expect(
			posted.find((m) => m.request === "redraw").board.settings.symbolCount,
		).toBe(6);

		posted.length = 0;
		onMessage({
			data: {
				request: "restart",
				settings: { ...defaultSettings, maxAttempts: "unlimited" },
			},
		});
		expect(
			posted.find((m) => m.request === "redraw").board.settings.maxAttempts,
		).toBeNull();
	});
});
