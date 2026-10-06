#ifndef CODEBREAKER_H_
#define CODEBREAKER_H_

#include <array>
#include <iosfwd>
#include <optional>
#include <string_view>

namespace codebreaker {

inline constexpr int kCodeLength = 4;
inline constexpr int kColorCount = 6;
inline constexpr int kMaxAttempts = 10;

using Code = std::array<int, kCodeLength>;

struct Feedback {
  int exact = 0;
  int misplaced = 0;
};

std::optional<Code> ParseGuess(std::string_view input);
Feedback Score(const Code& secret, const Code& guess);
void PrintPeg(std::ostream& output, int color, bool use_color);
void PrintCode(std::ostream& output, const Code& code, bool use_color);

}  // namespace codebreaker

#endif