# Yet Another Code Breaker

## Abstract

Yet Another Code Breaker is a deductive puzzle where the goal is to discover a secret
combination within a limited number of attempts. After each valid guess, the game provides
feedback about symbols that are in the correct position and symbols that are present but misplaced.

## Game Options

In the options menu, the game configuration can be changed:

- secret code length (4 or 5 symbols)
- range of possible symbol values (6 to 10)
- value representation: numbers (1 to 9 plus 0), colors (optimized for visibility),
  letters (A to J), or symbols (a predefined emoji set)
- maximum number of attempts (8, 10, 12, or unlimited)

## I18n

Language support (i18n) for the frontend is available in:

- English
- German
- French
- Portuguese
- Spanish
- Italian

## Game Mechanics and Rules

The player enters a guess by using the keypad, which displays the available values based
on the current options. An edit cursor indicates where the next selected value will be placed.
Additional keypad controls are Backspace for corrections and Enter to submit the current guess.

Feedback is shown as two counters that indicate the total number of symbols that are:

- correctly positioned (shown as a number on a green background)
- present in the secret but misplaced (shown as a number on an amber background)

When the player wins by finding the secret within the configured attempt limit:

- a success message is shown
- a celebration animation plays, with symbols bouncing briefly

When the player loses because the attempt limit is reached:

- a status message explains that the game is over
- the secret is revealed
- a defeat animation tilts the final guess like falling cards

## Highscores

A persistent highscore system tracks attempt count and elapsed time (from the first input
until the secret is solved) for day, week, and month periods. Highscore entries reset
automatically when a period ends or manually from the options menu.

Current highscores are displayed in a small semi-transparent overlay during gameplay.
