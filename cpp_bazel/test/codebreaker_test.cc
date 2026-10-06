#include "codebreaker.h"

#include <iostream>
#include <sstream>
#include <string>
#include <string_view>

namespace {

int failures = 0;
int checks = 0;

void Expect(bool condition, std::string_view description) {
  ++checks;
  if (condition) {
    std::cout << "PASS: " << description << '\n';
  } else {
    std::cerr << "FAIL: " << description << '\n';
    ++failures;
  }
}

void ExpectScore(const codebreaker::Code& secret,
                 const codebreaker::Code& guess, int exact, int misplaced,
                 std::string_view description) {
  const auto feedback = codebreaker::Score(secret, guess);
  Expect(feedback.exact == exact && feedback.misplaced == misplaced,
         description);
}

}  // namespace

int main() {
  std::cout << "CodeBreaker tests\n\nScoring\n";
  ExpectScore({1, 2, 3, 4}, {1, 2, 3, 4}, 4, 0, "all exact");
  ExpectScore({1, 2, 3, 4}, {4, 3, 2, 1}, 0, 4, "all misplaced");
  ExpectScore({1, 1, 2, 2}, {3, 3, 4, 4}, 0, 0, "no matches");
  ExpectScore({1, 1, 2, 3}, {1, 2, 1, 1}, 1, 2,
              "duplicate colors are counted only once");
  ExpectScore({1, 2, 3, 4}, {1, 1, 1, 1}, 1, 0,
              "exact matches cannot also be misplaced");
  ExpectScore({1, 1, 2, 2}, {2, 2, 1, 1}, 0, 4,
              "repeated colors in reversed positions");
  ExpectScore({1, 1, 1, 1}, {1, 1, 1, 1}, 4, 0, "all repeated");

  std::cout << "\nInput parsing\n";
  const codebreaker::Code expected{1, 2, 3, 4};
  Expect(codebreaker::ParseGuess("1234") == expected, "compact input");
  Expect(codebreaker::ParseGuess(" 1 2\t3 4\r ") == expected,
         "whitespace-separated input");
  Expect(codebreaker::ParseGuess("6666").has_value(), "largest color");
  struct InvalidInput {
    std::string_view value;
    std::string_view description;
  };
  constexpr InvalidInput invalid_inputs[] = {
      {"", "reject empty input"},
      {"   ", "reject whitespace-only input"},
      {"123", "reject too few digits: 123"},
      {"12345", "reject too many digits: 12345"},
      {"0234", "reject color below range: 0234"},
      {"7234", "reject color above range: 7234"},
      {"12a4", "reject letters: 12a4"},
      {"1,2,3,4", "reject comma separators: 1,2,3,4"},
      {"-1234", "reject negative sign: -1234"},
  };
  for (const auto& invalid : invalid_inputs) {
    Expect(!codebreaker::ParseGuess(invalid.value).has_value(),
           invalid.description);
  }

  std::cout << "\nPeg rendering\n";
  const std::array<std::string_view, codebreaker::kColorCount> styles{
      "\x1b[97;41m", "\x1b[30;42m", "\x1b[30;43m",
      "\x1b[97;44m", "\x1b[97;45m", "\x1b[30;46m"};
  for (int color = 1; color <= codebreaker::kColorCount; ++color) {
    const auto number = "[" + std::to_string(color) + "]";
    std::ostringstream colored;
    codebreaker::PrintPeg(colored, color, true);
    Expect(colored.str() == std::string(styles[color - 1]) + number + "\x1b[0m",
          "colored peg " + number + ": color, number, and style reset");
    std::ostringstream plain;
    codebreaker::PrintPeg(plain, color, false);
        Expect(plain.str() == number,
          "plain peg " + number + ": number without ANSI escapes");
  }
  std::ostringstream plain_code;
  codebreaker::PrintCode(plain_code, {1, 2, 3, 4}, false);
  Expect(plain_code.str() == "[1] [2] [3] [4]", "code peg spacing");
  std::ostringstream colored_code;
  codebreaker::PrintCode(colored_code, {1, 1, 6, 6}, true);
  Expect(colored_code.str() ==
             "\x1b[97;41m[1]\x1b[0m \x1b[97;41m[1]\x1b[0m "
             "\x1b[30;46m[6]\x1b[0m \x1b[30;46m[6]\x1b[0m",
         "repeated pegs keep the same color");

  if (failures != 0) {
    std::cerr << '\n' << failures << " of " << checks << " checks failed.\n";
    return 1;
  }
  std::cout << "\nAll " << checks << " CodeBreaker checks passed.\n";
  return 0;
}