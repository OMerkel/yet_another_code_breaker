#include "codebreaker.h"

#include <algorithm>
#include <cctype>
#include <ostream>

namespace codebreaker {

std::optional<Code> ParseGuess(std::string_view input) {
  Code guess{};
  int position = 0;
  for (char character : input) {
    if (std::isspace(static_cast<unsigned char>(character))) {
      continue;
    }
    if (character < '1' || character > '0' + kColorCount ||
        position == kCodeLength) {
      return std::nullopt;
    }
    guess[position++] = character - '0';
  }
  if (position != kCodeLength) {
    return std::nullopt;
  }
  return guess;
}

Feedback Score(const Code& secret, const Code& guess) {
  Feedback feedback;
  std::array<int, kColorCount + 1> remaining_secret{};
  std::array<int, kColorCount + 1> remaining_guess{};
  for (int position = 0; position < kCodeLength; ++position) {
    if (secret[position] == guess[position]) {
      ++feedback.exact;
    } else {
      ++remaining_secret[secret[position]];
      ++remaining_guess[guess[position]];
    }
  }
  for (int color = 1; color <= kColorCount; ++color) {
    feedback.misplaced +=
        std::min(remaining_secret[color], remaining_guess[color]);
  }
  return feedback;
}

void PrintPeg(std::ostream& output, int color, bool use_color) {
  constexpr std::array<std::string_view, kColorCount> styles{
      "\x1b[97;41m", "\x1b[30;42m", "\x1b[30;43m",
      "\x1b[97;44m", "\x1b[97;45m", "\x1b[30;46m"};
  if (use_color) {
    output << styles.at(static_cast<std::size_t>(color - 1));
  }
  output << '[' << color << ']';
  if (use_color) {
    output << "\x1b[0m";
  }
}

void PrintCode(std::ostream& output, const Code& code, bool use_color) {
  for (int position = 0; position < kCodeLength; ++position) {
    if (position != 0) {
      output << ' ';
    }
    PrintPeg(output, code[position], use_color);
  }
}

}  // namespace codebreaker