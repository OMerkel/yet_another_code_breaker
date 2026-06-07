// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

const escapeHtml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const tokenClasses = (item, extra = "") => {
	const classes = ["symbol-cell"];
	if (item?.kind === "color") classes.push("color-token");
	if (extra) classes.push(extra);
	return classes.join(" ");
};

const renderToken = (
	item,
	extraClass = "",
	content = item?.kind === "color" ? "" : (item?.text ?? ""),
	showColor = true,
) => {
	const style =
		showColor && item?.kind === "color"
			? ` style="background:${item.color}"`
			: "";
	return `<span class="${tokenClasses(item, extraClass)}"${style}>${escapeHtml(content)}</span>`;
};

const renderSecret = (board, texts) => {
	const revealed = board.status !== "playing";
	return board.secretDisplay
		.map((item, index) => {
			if (!revealed) {
				return renderToken(item, "masked", texts.maskToken, false);
			}
			const animationClass =
				board.animation === "celebrate"
					? "celebrate"
					: board.animation === "tilt"
						? "tilt"
						: "";
			return renderToken(
				item,
				animationClass,
				item.kind === "color" ? "" : (item.text ?? String(index + 1)),
				true,
			);
		})
		.join("");
};

const renderCurrentGuess = (board) =>
	Array.from({ length: board.settings.codeLength }, (_, index) => {
		const item = board.currentGuessDisplay[index] ?? null;
		if (item) return renderToken(item);
		const cursorClass =
			index === board.currentGuess.length ? "empty cursor" : "empty";
		return `<span class="symbol-cell ${cursorClass}">+</span>`;
	}).join("");

const renderHistory = (board, texts) => {
	const historyItems = board.history
		.map(
			(entry, index) => `
				<li class="history-item">
					<span class="history-index">#${index + 1}</span>
					<div class="history-guess">${entry.guessDisplay
						.map((item) => renderToken(item))
						.join("")}</div>
					<div class="feedback-badges">
						<span class="feedback-badge exact">${escapeHtml(texts.exactLabel)} ${entry.exact}</span>
						<span class="feedback-badge misplaced">${escapeHtml(texts.misplacedLabel)} ${entry.misplaced}</span>
					</div>
				</li>`,
		)
		.join("");

	// Show current guess at the end only while game is still in progress
	const currentGuessItem =
		board.status === "playing"
			? `
		<li class="history-item current-guess-item">
			<span class="history-index">#${board.history.length + 1}</span>
			<div class="history-guess">${renderCurrentGuess(board)}</div>
		</li>`
			: "";

	if (board.history.length === 0 && board.currentGuess.length === 0) {
		return `<p class="empty-history">${escapeHtml(texts.noAttemptsYet)}</p>`;
	}

	return `
		<ol class="history-list">
			${historyItems}
			${currentGuessItem}
		</ol>
	`;
};

const renderKeypadButton = (item, enabled) => {
	const style =
		item.kind === "color" ? ` style="background:${item.color}"` : "";
	const classes = ["keypad-button"];
	if (item.kind === "color") classes.push("color-token");
	return `<button class="${classes.join(" ")}" type="button" data-input-action="append" data-value="${item.value}"${style}${enabled ? "" : " disabled"}>${escapeHtml(item.kind === "color" ? "" : item.text)}</button>`;
};

const statusHeadline = (board, texts) => {
	if (board.status === "won") return texts.statusWon;
	if (board.status === "lost") return texts.statusLost;
	if (board.canSubmit) return texts.statusReady;
	return texts.statusPlaying;
};

const attemptsValue = (board, texts) =>
	board.attemptsRemaining === null
		? texts.unlimitedValue
		: `${board.attemptsUsed}/${board.settings.maxAttempts}`;

export const createRenderer = (root, onAction) => {
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-input-action]");
		if (!button) return;
		const type = button.getAttribute("data-input-action");
		const value = button.hasAttribute("data-value")
			? Number(button.getAttribute("data-value"))
			: undefined;
		onAction({ type, value });
	});

	const render = (board, viewModel) => {
		if (!board) {
			root.innerHTML = `<div class="hero-card"><p class="status-message">${escapeHtml(viewModel.texts.loading)}</p></div>`;
			const statusEl = document.getElementById("game-status");
			if (statusEl) statusEl.innerHTML = "";
			return;
		}

		const { texts, elapsedSeconds, settingsSummary } = viewModel;
		const keypadEnabled = board.status === "playing";
		const secretLabel =
			board.status === "playing" ? texts.secretHidden : texts.secretRevealed;
		root.innerHTML = `
			<div class="game-layout">
				<section class="hero-grid">
					<div class="hero-card">
						<div class="board-title-row">
							<div>
								<span class="eyebrow">${escapeHtml(texts.gameEyebrow)}</span>
								<h1 class="board-title">${escapeHtml(texts.gameTitle)}</h1>
							</div>
						</div>
						<div class="metrics-grid">
							<div class="metric"><span class="metric-label">${escapeHtml(texts.metricProfile)}</span><span class="metric-value">${escapeHtml(settingsSummary)}</span></div>
							<div class="metric"><span class="metric-label">${escapeHtml(texts.metricAttempts)}</span><span class="metric-value">${escapeHtml(attemptsValue(board, texts))}</span></div>
							<div class="metric"><span class="metric-label">${escapeHtml(texts.metricTime)}</span><span class="metric-value">${escapeHtml(elapsedSeconds)}</span></div>
						</div>
						<div>
							<div class="label-row"><h3>${escapeHtml(texts.secretLabel)}</h3><span class="inline-note">${escapeHtml(secretLabel)}</span></div>
							<div class="secret-row">${renderSecret(board, texts)}</div>
						</div>

					</div>
					<div class="history-card">
						<h2 class="card-title">${escapeHtml(texts.historyTitle)}</h2>
						${renderHistory(board, texts)}
					</div>
				</section>

				<section class="hero-grid">
					<div class="keypad-card">
						<h2 class="card-title">${escapeHtml(texts.keypadTitle)}</h2>
						<div class="keypad-grid">${board.keypad.map((item) => renderKeypadButton(item, keypadEnabled)).join("")}</div>
						<div class="keypad-actions">
							<button class="keypad-button submit" type="button" data-input-action="submit"${board.canSubmit ? "" : " disabled"}>${escapeHtml(texts.submit)}</button>
							<button class="keypad-button utility" type="button" data-input-action="backspace"${keypadEnabled ? "" : " disabled"}>${escapeHtml(texts.backspace)}</button>
							<button class="keypad-button utility" type="button" data-input-action="clear"${keypadEnabled ? "" : " disabled"}>${escapeHtml(texts.clear)}</button>
						</div>
					</div>
				</section>

			</div>
		`;
		const statusEl = document.getElementById("game-status");
		if (statusEl) {
			statusEl.innerHTML = `
				<h2 class="card-title">${escapeHtml(texts.statusCardTitle)}</h2>
				<p class="status-message">${escapeHtml(statusHeadline(board, texts))} — ${escapeHtml(texts.statusBody(board))}</p>
			`;
		}
	};

	return { render };
};
