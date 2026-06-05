// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import { getHighscoreEntry } from "./board.js";
import { formatDuration, normalizeSettings } from "./common.js";
import { createRenderer } from "./renderer.js";
import { Actions, appReducer, createStore, initialAppState } from "./store.js";

const SETTINGS_STORAGE_KEY = "codebreaker_user_settings";
const HIGHSCORE_STORAGE_KEY = "codebreaker_highscores";
const SUPPORTED_LANGUAGES = Object.freeze(["en", "de", "fr", "pt", "es", "it"]);
const sections = ["game", "rules", "options", "about"];
const store = createStore(appReducer, initialAppState);
const engine = new Worker("js/controller.js", { type: "module" });

const translations = {
	en: {
		tagline: "Deduce the secret code before the attempts run out.",
		rulesTitle: "Rules",
		rulesIntro:
			"Break the hidden code by entering guesses and interpreting the exact and misplaced feedback.",
		rulesGoalTitle: "Goal",
		rulesGoalBody:
			"Find the secret combination within the configured attempt limit. A guess is valid only when all slots are filled.",
		rulesFeedbackTitle: "Feedback",
		rulesFeedbackBody:
			"'Exact' counts symbols in the correct position. 'Misplaced' counts symbols that exist in the secret but are placed in the wrong slot.",
		rulesOptionsTitle: "Configurable Options",
		rulesOptionsLength: "Secret length can be 4 or 5.",
		rulesOptionsRange: "Available symbol values can range from 6 to 10.",
		rulesOptionsRepresentation:
			"Values can be shown as numbers, colors, letters, or symbols.",
		rulesOptionsAttempts: "Maximum attempts can be 8, 10, 12, or unlimited.",
		rulesOutcomeTitle: "Outcomes",
		rulesOutcomeBody: "Any winning or losing triggers a short animation.",
		optionsTitle: "Options",
		optionsHint:
			"Any change is applied to the current game board after leaving the options page. New Game starts a fresh secret.",
		optionsCodeLength: "Secret Length",
		optionsSymbolCount: "Value Range",
		optionsRepresentation: "Representation",
		optionsAttempts: "Maximum Attempts",
		optionsLanguage: "Language",
		optionsHighscores: "Highscores",
		representationNumbers: "Numbers",
		representationColors: "Colors",
		representationLetters: "Letters",
		representationSymbols: "Symbols",
		attemptsUnlimited: "Unlimited",
		aboutTitle: "About Yet Another Code Breaker",
		aboutSummary:
			"A browser-first deductive puzzle with functional core logic, persistent highscores, and offline-ready packaging.",
		aboutLicense:
			"All source code in this edition is released under the MIT License.",
		aboutRuntime: "This implementation uses no third-party runtime libraries.",
		menuClose: "Close",
		menuNew: "New Game",
		menuRules: "Rules...",
		menuOptions: "Options...",
		menuAbout: "About...",
		back: "Back",
		ok: "OK",
		resetToday: "Reset Today",
		resetWeek: "Reset Week",
		resetMonth: "Reset Month",
		scoreToday: "Today",
		scoreWeek: "Week",
		scoreMonth: "Month",
		gameEyebrow: "Deduction Engine",
		gameTitle: "Yet Another Code Breaker",
		gameSubtitle:
			"Fill the slots, submit a full guess, and use the exact and misplaced counts to zero in on the secret.",
		metricProfile: "Profile",
		metricAttempts: "Attempts",
		metricTime: "Time",
		secretLabel: "Secret",
		secretHidden: "Hidden",
		secretRevealed: "Revealed",
		currentGuessLabel: "Current Guess",
		cursorHint: "Next slot is marked",
		statusCardTitle: "Status",
		historyTitle: "Guess History",
		historyHint: "Latest guess appears last",
		keypadTitle: "Keypad",
		quickRulesTitle: "In-Game Rules",
		quickRulesHint: "Full rules stay in the menu page",
		quickRule1:
			"Enter exactly the configured number of symbols before submitting.",
		quickRule2:
			"Exact counts the right symbol in the right slot; misplaced counts a right symbol in a different slot.",
		quickRule3:
			"Beat the attempt limit to record a highscore for the current day, week, and month.",
		exactLabel: "Exact",
		misplacedLabel: "Misplaced",
		attemptLabel: "Guess",
		backspace: "Back",
		clear: "Clear",
		submit: "Enter",
		loading: "Loading current game...",
		maskToken: "?",
		noAttemptsYet: "No guesses submitted yet.",
		statusWon: "Code broken",
		statusLost: "Code locked",
		statusReady: "Ready to submit",
		statusPlaying: "In progress",
		statusBody: (board) => {
			if (board.status === "won")
				return "You found the secret. Start a new game and good luck to chase an even better score.";
			if (board.status === "lost")
				return "The final attempt is gone. Review the revealed secret and try again.";
			if (board.canSubmit)
				return "Your guess is complete. Submit it to receive feedback.";
			return `Choose ${board.settings.codeLength - board.currentGuess.length} more symbol${board.settings.codeLength - board.currentGuess.length === 1 ? "" : "s"}.`;
		},
		unlimitedValue: "Unlimited",
		confirmReset: "Are you sure?",
		highscoreNone: "-",
		highscoreFormat: (entry) =>
			`${entry.attempts} tries / ${formatDuration(entry.seconds)}`,
	},
	de: {
		tagline: "Entschlüssele den Geheimcode, bevor die Versuche ausgehen.",
		rulesTitle: "Regeln",
		rulesIntro:
			"Knacke den verborgenen Code, indem du Tipps eingibst und exakte sowie versetzte Treffer auswertest.",
		rulesGoalTitle: "Ziel",
		rulesGoalBody:
			"Finde die geheime Kombination innerhalb der eingestellten maximalen Versuchszahl. Ein Tipp oder Versuch ist nur gültig, wenn alle Felder gefüllt sind.",
		rulesFeedbackTitle: "Rückmeldung",
		rulesFeedbackBody:
			"Es werden sowohl die Anzahl der Symbole an der richtigen Position als auch die Anzahl der Symbole, die im Code vorkommen, aber an anderer Stelle liegen, angezeigt.",
		rulesOptionsTitle: "Optionen",
		rulesOptionsLength: "Die Codelänge kann 4 oder 5 sein.",
		rulesOptionsRange: "Der Symbolvorrat kann von 6 bis 10 reichen.",
		rulesOptionsRepresentation:
			"Werte können als Zahlen, Farben, Buchstaben oder Symbole angezeigt werden.",
		rulesOptionsAttempts: "Maximale Versuche: 8, 10, 12 oder unbegrenzt.",
		rulesOutcomeTitle: "Ergebnis",
		rulesOutcomeBody:
			"Ein Sieg oder auch eine Niederlage lösen jeweils eine kurze Animation aus.",
		optionsTitle: "Optionen",
		optionsHint:
			"Änderungen gelten weiter für das aktuelle Spielbrett. 'Neues Spiel' erzeugt einen neuen Geheimcode.",
		optionsCodeLength: "Codelänge",
		optionsSymbolCount: "Wertebereich",
		optionsRepresentation: "Darstellung",
		optionsAttempts: "Maximale Versuche",
		optionsLanguage: "Sprache",
		optionsHighscores: "Bestwerte",
		representationNumbers: "Zahlen",
		representationColors: "Farben",
		representationLetters: "Buchstaben",
		representationSymbols: "Symbole",
		attemptsUnlimited: "Unbegrenzt",
		aboutTitle: "Über Yet Another Code Breaker",
		aboutSummary: "Ein browserbasiertes Deduktionsspiel.",
		aboutLicense:
			"Der gesamte Quellcode dieser Ausgabe steht unter der MIT-Lizenz.",
		aboutRuntime:
			"Diese Implementierung verwendet keine Drittanbieter-Laufzeitbibliotheken.",
		menuClose: "Schließen",
		menuNew: "Neues Spiel",
		menuRules: "Regeln...",
		menuOptions: "Optionen...",
		menuAbout: "Über...",
		back: "Zurück",
		ok: "OK",
		resetToday: "Heute löschen",
		resetWeek: "Woche löschen",
		resetMonth: "Monat löschen",
		scoreToday: "Heute",
		scoreWeek: "Woche",
		scoreMonth: "Monat",
		gameEyebrow: "Deduktionsmotor",
		gameTitle: "Yet Another Code Breaker",
		gameSubtitle:
			"Fülle die Felder, sende einen vollständigen Tipp und nutze exakte sowie versetzte Treffer, um den Geheimcode einzugrenzen.",
		metricProfile: "Profil",
		metricAttempts: "Versuche",
		metricTime: "Zeit",
		secretLabel: "Geheimcode",
		secretHidden: "Verborgen",
		secretRevealed: "Sichtbar",
		currentGuessLabel: "Aktueller Tipp",
		cursorHint: "Das nächste Feld ist markiert",
		statusCardTitle: "Status",
		historyTitle: "Tipphistorie",
		historyHint: "Der neueste Tipp steht zuletzt",
		keypadTitle: "Tastenfeld",
		quickRulesTitle: "Regeln im Spiel",
		quickRulesHint: "Die ausführlichen Regeln finden sich im Menü",
		quickRule1:
			"Vor dem Senden muss die konfigurierte Anzahl an Symbolen eingetragen sein.",
		quickRule2:
			"'Exakt' zählt das richtige Symbol am richtigen Platz, 'Versetzt' das richtige Symbol am falschen Platz.",
		quickRule3:
			"Schlage das Versuchslimit, um Tages-, Wochen- und Monatsbestwerte zu speichern.",
		exactLabel: "Exakt",
		misplacedLabel: "Versetzt",
		attemptLabel: "Tipp",
		backspace: "Zurück",
		clear: "Leeren",
		submit: "Eingabe",
		loading: "Aktuelles Spiel wird geladen...",
		noAttemptsYet: "Noch keine Tipps gesendet.",
		statusWon: "Code geknackt",
		statusLost: "Code gesperrt",
		statusReady: "Bereit zum Senden",
		statusPlaying: "Läuft",
		statusBody: (board) => {
			if (board.status === "won")
				return "Geheimcode gefunden. Starte ein neues Spiel und viel Glück, um einen noch besseren Score zu erzielen.";
			if (board.status === "lost")
				return "Der letzte Versuch ist vorbei. Überprüfe den aufgedeckten Geheimcode und versuche es erneut.";
			if (board.canSubmit)
				return "Dein Tipp ist vollständig. Sende ihn ab, um Feedback zu erhalten.";
			return `Wähle noch ${board.settings.codeLength - board.currentGuess.length} Symbol${board.settings.codeLength - board.currentGuess.length === 1 ? "" : "e"}.`;
		},
		unlimitedValue: "Unbegrenzt",
		confirmReset: "Sind Sie sicher?",
		highscoreFormat: (entry) =>
			`${entry.attempts} Versuche / ${formatDuration(entry.seconds)}`,
	},
	fr: {
		tagline: "Déduisez le code secret avant d'épuiser vos tentatives.",
		rulesTitle: "Règles",
		rulesIntro:
			"Cassez le code caché en proposant des combinaisons et en lisant les retours exacts et déplacés.",
		rulesGoalTitle: "Objectif",
		rulesGoalBody:
			"Trouvez la combinaison secrète dans la limite de tentatives configurée. Une proposition est valide seulement si tous les emplacements sont remplis.",
		rulesFeedbackTitle: "Retour",
		rulesFeedbackBody:
			"Le vert compte les symboles à la bonne position. L'orange compte les symboles présents dans le secret mais placés ailleurs.",
		rulesOptionsTitle: "Options configurables",
		rulesOptionsLength: "La longueur du secret peut être 4 ou 5.",
		rulesOptionsRange:
			"Le nombre de symboles disponibles peut aller de 6 à 10.",
		rulesOptionsRepresentation:
			"Les valeurs peuvent s'afficher en nombres, couleurs, lettres ou symboles.",
		rulesOptionsAttempts:
			"Le maximum de tentatives peut être 8, 10, 12 ou illimité.",
		rulesOutcomeTitle: "Résultats",
		rulesOutcomeBody:
			"Une victoire déclenche une animation de célébration, tandis qu'une défaite révèle le secret et fait basculer la dernière proposition.",
		optionsTitle: "Options",
		optionsHint:
			"Chaque changement est appliqué à la partie en cours après la fermeture des options. Nouvelle partie génère un nouveau secret.",
		aboutTitle: "À propos de Yet Another Code Breaker",
		aboutSummary:
			"Une énigme déductive pensée pour le navigateur, avec logique fonctionnelle, meilleurs scores persistants et fonctionnement hors ligne.",
		aboutLicense:
			"Tout le code source de cette édition est publié sous licence MIT.",
		aboutRuntime:
			"Cette implémentation n'utilise aucune bibliothèque runtime tierce.",
		optionsCodeLength: "Longueur du code",
		optionsSymbolCount: "Plage de valeurs",
		optionsRepresentation: "Représentation",
		optionsAttempts: "Tentatives maximum",
		optionsLanguage: "Langue",
		optionsHighscores: "Meilleurs scores",
		representationNumbers: "Nombres",
		representationColors: "Couleurs",
		representationLetters: "Lettres",
		representationSymbols: "Symboles",
		attemptsUnlimited: "Illimité",
		menuClose: "Fermer",
		menuNew: "Nouvelle partie",
		menuRules: "Règles...",
		menuOptions: "Options...",
		menuAbout: "À propos...",
		back: "Retour",
		ok: "OK",
		resetToday: "Réinit. aujourd'hui",
		resetWeek: "Réinit. semaine",
		resetMonth: "Réinit. mois",
		scoreToday: "Jour",
		scoreWeek: "Semaine",
		scoreMonth: "Mois",
		gameEyebrow: "Moteur de déduction",
		gameTitle: "Yet Another Code Breaker",
		gameSubtitle:
			"Remplissez les emplacements, envoyez une proposition complète et utilisez les comptes exacts et déplacés pour trouver le secret.",
		metricProfile: "Profil",
		metricAttempts: "Essais",
		metricTime: "Temps",
		secretLabel: "Secret",
		secretHidden: "Masqué",
		secretRevealed: "Révélé",
		currentGuessLabel: "Proposition actuelle",
		cursorHint: "Le prochain emplacement est marqué",
		statusCardTitle: "État",
		historyTitle: "Historique",
		historyHint: "La proposition la plus récente apparaît en dernier",
		keypadTitle: "Clavier",
		quickRulesTitle: "Règles en jeu",
		quickRulesHint: "Les règles complètes restent dans la page menu",
		quickRule1:
			"Saisissez exactement le nombre de symboles configuré avant d'envoyer.",
		quickRule2:
			"Exact compte le bon symbole à la bonne place ; déplacé compte un bon symbole placé ailleurs.",
		quickRule3:
			"Battez la limite de tentatives pour enregistrer un meilleur score du jour, de la semaine et du mois.",
		exactLabel: "Exact",
		misplacedLabel: "Mal placé",
		attemptLabel: "Essai",
		backspace: "Retour",
		clear: "Effacer",
		submit: "Entrée",
		loading: "Chargement de la partie en cours...",
		maskToken: "?",
		noAttemptsYet: "Aucune proposition envoyée pour le moment.",
		statusWon: "Code trouvé",
		statusLost: "Code verrouillé",
		statusReady: "Prêt à envoyer",
		statusPlaying: "En cours",
		statusBody: (board) => {
			if (board.status === "won")
				return "Vous avez trouvé le secret. Lancez une nouvelle partie et bonne chance pour viser un score encore meilleur.";
			if (board.status === "lost")
				return "La dernière tentative est passée. Analysez le secret révélé et recommencez.";
			if (board.canSubmit)
				return "Votre proposition est complète. Envoyez-la pour recevoir un résultat.";
			return `Choisissez encore ${board.settings.codeLength - board.currentGuess.length} symbole${board.settings.codeLength - board.currentGuess.length === 1 ? "" : "s"}.`;
		},
		unlimitedValue: "Illimité",
		confirmReset: "Êtes-vous sûr ?",
		highscoreNone: "-",
		highscoreFormat: (entry) =>
			`${entry.attempts} essais / ${formatDuration(entry.seconds)}`,
	},
	pt: {
		tagline: "Descubra o código secreto antes que as tentativas acabem.",
		rulesTitle: "Regras",
		rulesIntro:
			"Quebre o código oculto enviando palpites e interpretando o retorno de exatos e deslocados.",
		rulesGoalTitle: "Objetivo",
		rulesGoalBody:
			"Encontre a combinação secreta dentro do limite de tentativas configurado. Um palpite só é válido quando todos os espaços estão preenchidos.",
		rulesFeedbackTitle: "Feedback",
		rulesFeedbackBody:
			"Verde conta símbolos na posição correta. Âmbar conta símbolos que existem no segredo, mas estão em posição diferente.",
		rulesOptionsTitle: "Opções configuráveis",
		rulesOptionsLength: "O tamanho do segredo pode ser 4 ou 5.",
		rulesOptionsRange:
			"A quantidade de símbolos disponíveis pode variar de 6 a 10.",
		rulesOptionsRepresentation:
			"Os valores podem ser exibidos como números, cores, letras ou símbolos.",
		rulesOptionsAttempts:
			"O máximo de tentativas pode ser 8, 10, 12 ou ilimitado.",
		rulesOutcomeTitle: "Resultados",
		rulesOutcomeBody:
			"Ao vencer, uma animação de celebração é exibida; ao perder, o segredo é revelado e o último palpite inclina como cartas caindo.",
		optionsTitle: "Opções",
		optionsHint:
			"Qualquer mudança é aplicada ao tabuleiro atual ao sair da tela de opções. Novo jogo cria um novo segredo.",
		aboutTitle: "Sobre Yet Another Code Breaker",
		aboutSummary:
			"Um quebra-cabeça dedutivo para navegador, com lógica funcional, recordes persistentes e pacote pronto para uso offline.",
		aboutLicense:
			"Todo o código-fonte desta edição é distribuído sob a licença MIT.",
		aboutRuntime:
			"Esta implementação não usa bibliotecas de runtime de terceiros.",
		optionsCodeLength: "Tamanho do código",
		optionsSymbolCount: "Faixa de valores",
		optionsRepresentation: "Representação",
		optionsAttempts: "Tentativas máximas",
		optionsLanguage: "Idioma",
		optionsHighscores: "Recordes",
		representationNumbers: "Números",
		representationColors: "Cores",
		representationLetters: "Letras",
		representationSymbols: "Símbolos",
		attemptsUnlimited: "Ilimitado",
		menuClose: "Fechar",
		menuNew: "Novo jogo",
		menuRules: "Regras...",
		menuOptions: "Opções...",
		menuAbout: "Sobre...",
		back: "Voltar",
		ok: "OK",
		resetToday: "Limpar hoje",
		resetWeek: "Limpar semana",
		resetMonth: "Limpar mês",
		scoreToday: "Hoje",
		scoreWeek: "Semana",
		scoreMonth: "Mês",
		gameEyebrow: "Motor de dedução",
		gameTitle: "Yet Another Code Breaker",
		gameSubtitle:
			"Preencha os espaços, envie um palpite completo e use as contagens de exatos e deslocados para chegar ao segredo.",
		metricProfile: "Perfil",
		metricAttempts: "Tentativas",
		metricTime: "Tempo",
		secretLabel: "Segredo",
		secretHidden: "Oculto",
		secretRevealed: "Revelado",
		currentGuessLabel: "Palpite atual",
		cursorHint: "O próximo espaço está marcado",
		statusCardTitle: "Estado",
		historyTitle: "Histórico",
		historyHint: "O palpite mais recente aparece por último",
		keypadTitle: "Teclado",
		quickRulesTitle: "Regras no jogo",
		quickRulesHint: "As regras completas ficam na página do menu",
		quickRule1:
			"Digite exatamente a quantidade configurada de símbolos antes de enviar.",
		quickRule2:
			"Exato conta o símbolo correto na posição correta; deslocado conta o símbolo correto em outra posição.",
		quickRule3:
			"Supere o limite de tentativas para registrar recordes do dia, semana e mês.",
		exactLabel: "Exato",
		misplacedLabel: "Fora do lugar",
		attemptLabel: "Palpite",
		backspace: "Apagar",
		clear: "Limpar",
		submit: "Enviar",
		loading: "Carregando partida atual...",
		maskToken: "?",
		noAttemptsYet: "Nenhum palpite enviado ainda.",
		statusWon: "Código descoberto",
		statusLost: "Código bloqueado",
		statusReady: "Pronto para enviar",
		statusPlaying: "Em andamento",
		statusBody: (board) => {
			if (board.status === "won")
				return "Você descobriu o segredo. Inicie um novo jogo e boa sorte para buscar uma pontuação ainda melhor.";
			if (board.status === "lost")
				return "A tentativa final acabou. Reveja o segredo revelado e tente novamente.";
			if (board.canSubmit)
				return "Seu palpite está completo. Envie para receber retorno.";
			return `Escolha mais ${board.settings.codeLength - board.currentGuess.length} símbolo${board.settings.codeLength - board.currentGuess.length === 1 ? "" : "s"}.`;
		},
		unlimitedValue: "Ilimitado",
		confirmReset: "Tem certeza?",
		highscoreNone: "-",
		highscoreFormat: (entry) =>
			`${entry.attempts} tentativas / ${formatDuration(entry.seconds)}`,
	},
	es: {
		tagline: "Deduce el código secreto antes de agotar los intentos.",
		rulesTitle: "Reglas",
		rulesIntro:
			"Rompe el código oculto introduciendo intentos e interpretando las pistas exactas y desplazadas.",
		rulesGoalTitle: "Objetivo",
		rulesGoalBody:
			"Encuentra la combinación secreta dentro del límite de intentos configurado. Un intento solo es válido cuando todos los espacios están completos.",
		rulesFeedbackTitle: "Comentarios",
		rulesFeedbackBody:
			"El verde cuenta símbolos en la posición correcta. El ámbar cuenta símbolos que están en el secreto pero en otra posición.",
		rulesOptionsTitle: "Opciones configurables",
		rulesOptionsLength: "La longitud del secreto puede ser 4 o 5.",
		rulesOptionsRange:
			"Los valores de símbolo disponibles pueden ir de 6 a 10.",
		rulesOptionsRepresentation:
			"Los valores pueden mostrarse como números, colores, letras o símbolos.",
		rulesOptionsAttempts:
			"Los intentos máximos pueden ser 8, 10, 12 o ilimitados.",
		rulesOutcomeTitle: "Resultados",
		rulesOutcomeBody:
			"Ganar activa una animación de celebración, mientras que perder revela el secreto e inclina el último intento como cartas que caen.",
		optionsTitle: "Opciones",
		optionsHint:
			"Cada cambio se aplica al tablero actual al salir de opciones. Nueva partida genera un secreto nuevo.",
		aboutTitle: "Acerca de Yet Another Code Breaker",
		aboutSummary:
			"Un rompecabezas deductivo para navegador con lógica funcional, récords persistentes y empaquetado listo para uso sin conexión.",
		aboutLicense:
			"Todo el código fuente de esta edición se publica bajo la licencia MIT.",
		aboutRuntime:
			"Esta implementación no usa bibliotecas de ejecución de terceros.",
		optionsCodeLength: "Longitud del código",
		optionsSymbolCount: "Rango de valores",
		optionsRepresentation: "Representación",
		optionsAttempts: "Intentos máximos",
		optionsLanguage: "Idioma",
		optionsHighscores: "Récords",
		representationNumbers: "Números",
		representationColors: "Colores",
		representationLetters: "Letras",
		representationSymbols: "Símbolos",
		attemptsUnlimited: "Ilimitado",
		menuClose: "Cerrar",
		menuNew: "Partida nueva",
		menuRules: "Reglas...",
		menuOptions: "Opciones...",
		menuAbout: "Acerca de...",
		back: "Volver",
		ok: "OK",
		resetToday: "Reiniciar hoy",
		resetWeek: "Reiniciar semana",
		resetMonth: "Reiniciar mes",
		scoreToday: "Hoy",
		scoreWeek: "Semana",
		scoreMonth: "Mes",
		gameEyebrow: "Motor deductivo",
		gameTitle: "Yet Another Code Breaker",
		gameSubtitle:
			"Completa los espacios, envía un intento completo y usa los conteos exactos y desplazados para acotar el secreto.",
		metricProfile: "Perfil",
		metricAttempts: "Intentos",
		metricTime: "Tiempo",
		secretLabel: "Secreto",
		secretHidden: "Oculto",
		secretRevealed: "Revelado",
		currentGuessLabel: "Intento actual",
		cursorHint: "El siguiente espacio está marcado",
		statusCardTitle: "Estado",
		historyTitle: "Historial",
		historyHint: "El intento más reciente aparece al final",
		keypadTitle: "Teclado",
		quickRulesTitle: "Reglas en partida",
		quickRulesHint: "Las reglas completas permanecen en la página del menú",
		quickRule1:
			"Introduce exactamente la cantidad configurada de símbolos antes de enviar.",
		quickRule2:
			"Exacto cuenta el símbolo correcto en el lugar correcto; desplazado cuenta un símbolo correcto en otro lugar.",
		quickRule3:
			"Supera el límite de intentos para guardar récords del día, la semana y el mes.",
		exactLabel: "Exacto",
		misplacedLabel: "Desplazado",
		attemptLabel: "Intento",
		backspace: "Borrar",
		clear: "Limpiar",
		submit: "Enviar",
		loading: "Cargando partida actual...",
		maskToken: "?",
		noAttemptsYet: "Todavía no se enviaron intentos.",
		statusWon: "Código resuelto",
		statusLost: "Código bloqueado",
		statusReady: "Listo para enviar",
		statusPlaying: "En curso",
		statusBody: (board) => {
			if (board.status === "won")
				return "Encontraste el secreto. Inicia una nueva partida y buena suerte para lograr una puntuación aún mejor.";
			if (board.status === "lost")
				return "Se agotó el último intento. Revisa el secreto revelado y vuelve a intentarlo.";
			if (board.canSubmit)
				return "Tu intento está completo. Envíalo para recibir comentarios.";
			return `Elige ${board.settings.codeLength - board.currentGuess.length} símbolo${board.settings.codeLength - board.currentGuess.length === 1 ? "" : "s"} más.`;
		},
		unlimitedValue: "Ilimitado",
		confirmReset: "¿Seguro?",
		highscoreNone: "-",
		highscoreFormat: (entry) =>
			`${entry.attempts} intentos / ${formatDuration(entry.seconds)}`,
	},
	it: {
		tagline: "Deduce il codice segreto prima di esaurire i tentativi.",
		rulesTitle: "Regole",
		rulesIntro:
			"Svela il codice nascosto inserendo tentativi e interpretando i riscontri esatti e spostati.",
		rulesGoalTitle: "Obiettivo",
		rulesGoalBody:
			"Trova la combinazione segreta entro il limite di tentativi configurato. Un tentativo è valido solo quando tutti gli slot sono pieni.",
		rulesFeedbackTitle: "Feedback",
		rulesFeedbackBody:
			"Il verde conta i simboli nella posizione corretta. L'ambra conta i simboli presenti nel segreto ma in posizione diversa.",
		rulesOptionsTitle: "Opzioni configurabili",
		rulesOptionsLength: "La lunghezza del segreto può essere 4 o 5.",
		rulesOptionsRange:
			"I valori disponibili dei simboli possono andare da 6 a 10.",
		rulesOptionsRepresentation:
			"I valori possono essere mostrati come numeri, colori, lettere o simboli.",
		rulesOptionsAttempts:
			"I tentativi massimi possono essere 8, 10, 12 o illimitati.",
		rulesOutcomeTitle: "Esiti",
		rulesOutcomeBody:
			"La vittoria attiva un'animazione celebrativa, mentre la sconfitta rivela il segreto e inclina l'ultimo tentativo come carte che cadono.",
		optionsTitle: "Opzioni",
		optionsHint:
			"Ogni modifica viene applicata alla partita corrente quando esci dalle opzioni. Nuova partita genera un nuovo segreto.",
		aboutTitle: "Informazioni su Yet Another Code Breaker",
		aboutSummary:
			"Un rompicapo deduttivo pensato per il browser con logica funzionale, migliori punteggi persistenti e pacchetto pronto per l'uso offline.",
		aboutLicense:
			"Tutto il codice sorgente di questa edizione è rilasciato con licenza MIT.",
		aboutRuntime:
			"Questa implementazione non usa librerie runtime di terze parti.",
		optionsCodeLength: "Lunghezza codice",
		optionsSymbolCount: "Intervallo valori",
		optionsRepresentation: "Rappresentazione",
		optionsAttempts: "Tentativi massimi",
		optionsLanguage: "Lingua",
		optionsHighscores: "Migliori punteggi",
		representationNumbers: "Numeri",
		representationColors: "Colori",
		representationLetters: "Lettere",
		representationSymbols: "Simboli",
		attemptsUnlimited: "Illimitato",
		menuClose: "Chiudi",
		menuNew: "Nuova partita",
		menuRules: "Regole...",
		menuOptions: "Opzioni...",
		menuAbout: "Informazioni...",
		back: "Indietro",
		ok: "OK",
		resetToday: "Azzera oggi",
		resetWeek: "Azzera settimana",
		resetMonth: "Azzera mese",
		scoreToday: "Oggi",
		scoreWeek: "Settimana",
		scoreMonth: "Mese",
		gameEyebrow: "Motore deduttivo",
		gameTitle: "Yet Another Code Breaker",
		gameSubtitle:
			"Compila gli slot, invia un tentativo completo e usa i conteggi esatti e spostati per avvicinarti al segreto.",
		metricProfile: "Profilo",
		metricAttempts: "Tentativi",
		metricTime: "Tempo",
		secretLabel: "Segreto",
		secretHidden: "Nascosto",
		secretRevealed: "Rivelato",
		currentGuessLabel: "Tentativo attuale",
		cursorHint: "Il prossimo slot è evidenziato",
		statusCardTitle: "Stato",
		historyTitle: "Cronologia",
		historyHint: "Il tentativo più recente appare per ultimo",
		keypadTitle: "Tastierino",
		quickRulesTitle: "Regole in gioco",
		quickRulesHint: "Le regole complete restano nella pagina menu",
		quickRule1:
			"Inserisci esattamente il numero configurato di simboli prima di inviare.",
		quickRule2:
			"Esatto conta il simbolo corretto nello slot corretto; spostato conta un simbolo corretto in uno slot diverso.",
		quickRule3:
			"Batti il limite di tentativi per registrare un miglior punteggio giornaliero, settimanale e mensile.",
		exactLabel: "Esatto",
		misplacedLabel: "Spostato",
		attemptLabel: "Tentativo",
		backspace: "Cancella",
		clear: "Svuota",
		submit: "Invio",
		loading: "Caricamento partita corrente...",
		maskToken: "?",
		noAttemptsYet: "Nessun tentativo inviato finora.",
		statusWon: "Codice risolto",
		statusLost: "Codice bloccato",
		statusReady: "Pronto all'invio",
		statusPlaying: "In corso",
		statusBody: (board) => {
			if (board.status === "won")
				return "Hai trovato il segreto. Avvia una nuova partita e buona fortuna per puntare a un punteggio ancora migliore.";
			if (board.status === "lost")
				return "L'ultimo tentativo è terminato. Rivedi il segreto rivelato e riprova.";
			if (board.canSubmit)
				return "Il tuo tentativo è completo. Invialo per ricevere il riscontro.";
			return `Scegli ancora ${board.settings.codeLength - board.currentGuess.length} simbolo${board.settings.codeLength - board.currentGuess.length === 1 ? "" : "i"}.`;
		},
		unlimitedValue: "Illimitato",
		confirmReset: "Sei sicuro?",
		highscoreNone: "-",
		highscoreFormat: (entry) =>
			`${entry.attempts} tentativi / ${formatDuration(entry.seconds)}`,
	},
};

const getTexts = (language) => ({
	...translations.en,
	...(translations[language] ?? {}),
});

const renderer = createRenderer(document.getElementById("board"), (action) => {
	sendToEngine("move", { action });
});

const pad2 = (value) => String(value).padStart(2, "0");
const getTodayKey = (date = new Date()) =>
	`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const getMonthKey = (date = new Date()) =>
	`${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
const getWeekKey = (date = new Date()) => {
	const utcDate = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const day = utcDate.getUTCDay() || 7;
	utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
	return `${utcDate.getUTCFullYear()}-W${pad2(week)}`;
};

const emptyScores = () => ({
	today: { period: "", entries: {} },
	week: { period: "", entries: {} },
	month: { period: "", entries: {} },
});

const normalizeScoreEntry = (entry) => {
	if (!entry || typeof entry !== "object") return null;
	if (!Number.isInteger(entry.attempts) || !Number.isInteger(entry.seconds))
		return null;
	return {
		attempts: entry.attempts,
		seconds: entry.seconds,
		label: typeof entry.label === "string" ? entry.label : "",
	};
};

const normalizeScores = (value) => {
	const base = emptyScores();
	if (!value || typeof value !== "object") return base;
	for (const period of ["today", "week", "month"]) {
		const item = value[period];
		if (!item || typeof item !== "object") continue;
		base[period].period = typeof item.period === "string" ? item.period : "";
		if (item.entries && typeof item.entries === "object") {
			for (const [key, entry] of Object.entries(item.entries)) {
				const normalized = normalizeScoreEntry(entry);
				if (normalized) {
					base[period].entries[key] = normalized;
				}
			}
		}
	}
	return base;
};

const refreshScorePeriods = (scores) => {
	const next = normalizeScores(scores);
	const now = new Date();
	const periods = {
		today: getTodayKey(now),
		week: getWeekKey(now),
		month: getMonthKey(now),
	};
	for (const period of ["today", "week", "month"]) {
		if (next[period].period !== periods[period]) {
			next[period] = { period: periods[period], entries: {} };
		}
	}
	return next;
};

const configKey = (settings) =>
	`${settings.codeLength}x${settings.symbolCount}-${settings.representation}-${settings.maxAttempts ?? "u"}`;

const configLabel = (settings) =>
	`${settings.codeLength}x${settings.symbolCount} / ${settings.representation} / ${settings.maxAttempts ?? "∞"}`;

const isBetterScore = (candidate, current) => {
	if (!current) return true;
	if (candidate.attempts !== current.attempts)
		return candidate.attempts < current.attempts;
	return candidate.seconds < current.seconds;
};

const loadScores = () => {
	try {
		const raw = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
		return refreshScorePeriods(raw ? JSON.parse(raw) : emptyScores());
	} catch (error) {
		console.warn("Failed to load highscores from localStorage:", error);
		return refreshScorePeriods(emptyScores());
	}
};

const saveScores = (scores) => {
	try {
		localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(scores));
	} catch (error) {
		console.warn("Failed to save highscores to localStorage:", error);
	}
};

const normalizeLanguage = (value) =>
	typeof value === "string" && SUPPORTED_LANGUAGES.includes(value)
		? value
		: "en";

let scoreState = loadScores();

const getScores = () => {
	const previousPeriods = {
		today: scoreState.today.period,
		week: scoreState.week.period,
		month: scoreState.month.period,
	};
	scoreState = refreshScorePeriods(scoreState);
	const periodChanged =
		scoreState.today.period !== previousPeriods.today ||
		scoreState.week.period !== previousPeriods.week ||
		scoreState.month.period !== previousPeriods.month;
	if (periodChanged) {
		saveScores(scoreState);
	}
	return scoreState;
};

const saveSettingsToStorage = () => {
	try {
		localStorage.setItem(
			SETTINGS_STORAGE_KEY,
			JSON.stringify(store.getState().settings),
		);
	} catch (error) {
		console.warn("Failed to save settings to localStorage:", error);
	}
};

const restoreSettingsFromStorage = () => {
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return {
			...normalizeSettings(parsed),
			language: normalizeLanguage(parsed.language),
		};
	} catch (error) {
		console.warn("Failed to restore settings from localStorage:", error);
		return null;
	}
};

const readSettings = () => ({
	...normalizeSettings({
		codeLength: document.querySelector('input[name="codeLength"]:checked')
			?.value,
		symbolCount: document.querySelector('input[name="symbolCount"]:checked')
			?.value,
		representation: document.querySelector(
			'input[name="representation"]:checked',
		)?.value,
		maxAttempts: document.querySelector('input[name="maxAttempts"]:checked')
			?.value,
	}),
	language: normalizeLanguage(
		document.querySelector('input[name="language"]:checked')?.value,
	),
});

const applySettingsToForm = (settings) => {
	const setChecked = (name, value) => {
		const input = document.querySelector(
			`input[name="${name}"][value="${value}"]`,
		);
		if (input) input.checked = true;
	};
	setChecked("codeLength", String(settings.codeLength));
	setChecked("symbolCount", String(settings.symbolCount));
	setChecked("representation", settings.representation);
	setChecked(
		"maxAttempts",
		settings.maxAttempts === null ? "unlimited" : String(settings.maxAttempts),
	);
	setChecked("language", normalizeLanguage(settings.language));
};

const updateHeaderBadge = (settings) => {
	const badge = document.getElementById("app-header-badge");
	badge.textContent = `${settings.codeLength}x${settings.symbolCount} | ${settings.representation} | ${normalizeLanguage(settings.language).toUpperCase()}`;
};

const showView = (view) => {
	sections.forEach((id) => {
		const node = document.getElementById(`view-${id}`);
		if (node) node.hidden = id !== view;
	});
};

const setText = (id, text) => {
	const node = document.getElementById(id);
	if (node) node.textContent = text;
};

const translateStaticText = (settings) => {
	const language = normalizeLanguage(settings.language);
	const texts = getTexts(language);
	document.documentElement.lang = language;
	setText("app-header-title", "Yet Another Code Breaker");
	setText("app-header-subtitle", texts.tagline);
	setText("btn-panel-close", texts.menuClose);
	setText("nav-new", texts.menuNew);
	setText("nav-rules", texts.menuRules);
	setText("nav-options", texts.menuOptions);
	setText("nav-about", texts.menuAbout);
	setText("btn-options-ok", texts.ok);
	document.querySelectorAll("[data-nav-back='game']").forEach((node) => {
		node.textContent = texts.back;
	});
	setText("label-score-today", texts.scoreToday);
	setText("label-score-week", texts.scoreWeek);
	setText("label-score-month", texts.scoreMonth);
	setText("label-options-score-today", texts.scoreToday);
	setText("label-options-score-week", texts.scoreWeek);
	setText("label-options-score-month", texts.scoreMonth);
	setText("btn-reset-score-today", texts.resetToday);
	setText("btn-reset-score-week", texts.resetWeek);
	setText("btn-reset-score-month", texts.resetMonth);
	document.querySelectorAll("[data-i18n]").forEach((node) => {
		const key = node.getAttribute("data-i18n");
		if (key && texts[key]) {
			node.textContent = texts[key];
		}
	});
};

const sendToEngine = (request, extra = {}) => {
	engine.postMessage({ request, settings: readSettings(), ...extra });
};

const formatScore = (entry, settings) => {
	const language = normalizeLanguage(settings.language);
	if (!entry) return getTexts(language).highscoreNone;
	return getTexts(language).highscoreFormat(entry);
};

const renderHighscores = () => {
	const state = store.getState();
	const scores = getScores();
	const key = configKey(state.settings);
	setText(
		"game-score-today",
		formatScore(scores.today.entries[key], state.settings),
	);
	setText(
		"game-score-week",
		formatScore(scores.week.entries[key], state.settings),
	);
	setText(
		"game-score-month",
		formatScore(scores.month.entries[key], state.settings),
	);
	setText(
		"score-today",
		formatScore(scores.today.entries[key], state.settings),
	);
	setText("score-week", formatScore(scores.week.entries[key], state.settings));
	setText(
		"score-month",
		formatScore(scores.month.entries[key], state.settings),
	);
};

const recordCompletedGame = (board) => {
	const entry = getHighscoreEntry(board);
	if (!entry) return;
	const scores = getScores();
	const key = configKey(board.settings);
	const candidate = { ...entry, label: configLabel(board.settings) };
	for (const period of ["today", "week", "month"]) {
		if (isBetterScore(candidate, scores[period].entries[key])) {
			scores[period].entries[key] = candidate;
		}
	}
	scoreState = scores;
	saveScores(scores);
	renderHighscores();
};

const resetHighscore = (period) => {
	const state = store.getState();
	const texts = getTexts(state.settings.language);
	if (!window.confirm(texts.confirmReset)) return;
	const scores = getScores();
	delete scores[period].entries[configKey(state.settings)];
	scoreState = scores;
	saveScores(scores);
	renderHighscores();
};

const closePanel = () => {
	document.getElementById("side-panel").classList.remove("open");
	document.getElementById("panel-overlay").hidden = true;
};

const openPanel = () => {
	document.getElementById("side-panel").classList.add("open");
	document.getElementById("panel-overlay").hidden = false;
};

const renderBoard = () => {
	const state = store.getState();
	const texts = getTexts(state.settings.language);
	const elapsedSeconds = state.board?.firstInputAt
		? formatDuration(
				Math.max(
					Math.floor(
						((state.board.finishedAt ?? Date.now()) -
							state.board.firstInputAt) /
							1000,
					),
					0,
				),
			)
		: formatDuration(0);
	renderer.render(state.board, {
		texts,
		elapsedSeconds,
		settingsSummary: configLabel(state.settings),
	});
};

let previousStatus = null;

store.subscribe((state) => {
	showView(state.view);
	translateStaticText(state.settings);
	updateHeaderBadge(state.settings);
	renderHighscores();
	renderBoard();
	if (state.board?.status === "won" && previousStatus !== "won") {
		recordCompletedGame(state.board);
	}
	previousStatus = state.board?.status ?? null;
});

engine.addEventListener("message", ({ data }) => {
	if (data.request === "redraw") {
		store.dispatch({ type: Actions.ENGINE_BOARD_UPDATE, board: data.board });
	}
	if (data.request === "human_to_move") {
		store.dispatch({ type: Actions.HUMAN_TURN_READY, board: data.board });
	}
});

engine.addEventListener("error", (event) => {
	console.error("Worker crashed:", event.message, event.filename, event.lineno);
});

const bindEvents = () => {
	document.getElementById("btn-menu").addEventListener("click", openPanel);
	document.getElementById("btn-panel-close").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
	});
	document
		.getElementById("panel-overlay")
		.addEventListener("click", closePanel);
	document.getElementById("nav-rules").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "rules" });
	});
	document.getElementById("nav-options").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "options" });
	});
	document.getElementById("nav-about").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "about" });
	});
	document.getElementById("nav-new").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
		store.dispatch({ type: Actions.NEW_GAME });
		sendToEngine("restart");
	});
	document.querySelectorAll("[data-nav-back='game']").forEach((button) => {
		button.addEventListener("click", () => {
			store.dispatch({ type: Actions.NAVIGATE, view: "game" });
		});
	});
	document.getElementById("btn-options-ok").addEventListener("click", () => {
		const settings = readSettings();
		store.dispatch({ type: Actions.SETTINGS_CHANGE, settings });
		saveSettingsToStorage();
		store.dispatch({ type: Actions.NEW_GAME });
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
		sendToEngine("restart");
	});
	document
		.getElementById("btn-reset-score-today")
		.addEventListener("click", () => resetHighscore("today"));
	document
		.getElementById("btn-reset-score-week")
		.addEventListener("click", () => resetHighscore("week"));
	document
		.getElementById("btn-reset-score-month")
		.addEventListener("click", () => resetHighscore("month"));
	document.getElementById("options-form").addEventListener("change", () => {
		const settings = readSettings();
		store.dispatch({ type: Actions.SETTINGS_CHANGE, settings });
		saveSettingsToStorage();
	});
	document.addEventListener("keydown", (event) => {
		if (store.getState().view !== "game") return;
		if (event.key === "Backspace") {
			event.preventDefault();
			sendToEngine("move", { action: { type: "backspace" } });
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			sendToEngine("move", { action: { type: "submit" } });
			return;
		}
		const settings = store.getState().settings;
		if (settings.representation === "numbers") {
			const mapping = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
			const index = mapping.indexOf(event.key);
			if (index >= 0 && index < settings.symbolCount) {
				sendToEngine("move", { action: { type: "append", value: index } });
			}
		}
		if (settings.representation === "letters") {
			const char = event.key.toUpperCase();
			const index = "ABCDEFGHIJ".indexOf(char);
			if (index >= 0 && index < settings.symbolCount) {
				sendToEngine("move", { action: { type: "append", value: index } });
			}
		}
	});
};

const registerServiceWorker = () => {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("js/sw.js").catch((error) => {
			console.warn("Service worker registration failed:", error);
		});
	}
};

const initialize = () => {
	const restored = restoreSettingsFromStorage() ?? {
		...store.getState().settings,
		language: "en",
	};
	store.dispatch({ type: Actions.SETTINGS_CHANGE, settings: restored });
	applySettingsToForm(restored);
	translateStaticText(restored);
	bindEvents();
	renderHighscores();
	renderBoard();
	sendToEngine("start");
	registerServiceWorker();
	window.setInterval(() => {
		if (store.getState().board?.status === "playing") {
			renderBoard();
		}
	}, 1000);
};

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
	initialize();
}

export { restoreSettingsFromStorage, saveSettingsToStorage };
