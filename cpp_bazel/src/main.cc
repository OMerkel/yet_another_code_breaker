#include "codebreaker.h"

#include <cstdio>
#include <cstdlib>
#include <exception>
#include <iostream>
#include <random>
#include <string>
#include <string_view>

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <io.h>
#else
#include <unistd.h>
#endif

namespace {

bool EnableTerminalColors() {
#ifdef _WIN32
  if (!_isatty(_fileno(stdout))) {
    return false;
  }
  const HANDLE output = GetStdHandle(STD_OUTPUT_HANDLE);
  DWORD mode = 0;
  return GetConsoleMode(output, &mode) &&
         SetConsoleMode(output, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
#else
  const char* terminal = std::getenv("TERM");
  return isatty(fileno(stdout)) && terminal != nullptr &&
         std::string_view(terminal) != "dumb";
#endif
}

void PrintHelp(bool use_color) {
  std::cout << "CodeBreaker\n"
            << "Guess the secret code: 4 digits, each from 1 to 6.\n"
            << "Repeated colors are allowed. You have 10 attempts.\n"
            << "Enter 1234 or 1 2 3 4.\n"
            << "Exact = correct color and position.\n"
            << "Misplaced = correct color in a different position.\n"
            << "Each peg is counted at most once.\n"
            << "Type help for these rules or quit to exit.\n"
            << "Colors: ";
  constexpr std::array<std::string_view, codebreaker::kColorCount> names{
      "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan"};
  for (int color = 1; color <= codebreaker::kColorCount; ++color) {
    codebreaker::PrintPeg(std::cout, color, use_color);
    std::cout << ' ' << names[color - 1];
    if (color != codebreaker::kColorCount) {
      std::cout << "  ";
    }
  }
  std::cout << "\n\n";
}

std::string_view Trim(std::string_view input) {
  const auto first = input.find_first_not_of(" \t\r\n");
  if (first == std::string_view::npos) {
    return {};
  }
  const auto last = input.find_last_not_of(" \t\r\n");
  return input.substr(first, last - first + 1);
}

void RevealSecret(const codebreaker::Code& secret, bool use_color) {
  std::cout << "Secret code: ";
  codebreaker::PrintCode(std::cout, secret, use_color);
  std::cout << '\n';
}

bool PlayGame(std::mt19937& generator, bool use_color) {
  std::uniform_int_distribution<int> color(1, codebreaker::kColorCount);
  codebreaker::Code secret{};
  for (int& peg : secret) {
    peg = color(generator);
  }

  int attempt = 1;
  while (attempt <= codebreaker::kMaxAttempts) {
    std::cout << "Attempt " << attempt << '/' << codebreaker::kMaxAttempts
              << "> " << std::flush;
    std::string input;
    if (!std::getline(std::cin, input)) {
      std::cout << "\nInput closed. Goodbye.\n";
      return false;
    }
    const auto command = Trim(input);
    if (command == "quit" || command == "q") {
      RevealSecret(secret, use_color);
      std::cout << "Goodbye.\n";
      return false;
    }
    if (command == "help" || command == "h") {
      PrintHelp(use_color);
      continue;
    }

    const auto guess = codebreaker::ParseGuess(input);
    if (!guess) {
      std::cout << "Invalid guess. Enter exactly 4 digits from 1 to 6.\n";
      continue;
    }
    const auto feedback = codebreaker::Score(secret, *guess);
    std::cout << "Guess: ";
    codebreaker::PrintCode(std::cout, *guess, use_color);
    std::cout << "  | Exact: " << feedback.exact
              << " | Misplaced: " << feedback.misplaced << '\n';
    if (feedback.exact == codebreaker::kCodeLength) {
      RevealSecret(secret, use_color);
      std::cout << "You cracked the code in " << attempt << " attempt(s)!\n";
      return true;
    }
    ++attempt;
  }

  std::cout << "No attempts left.\n";
  RevealSecret(secret, use_color);
  return true;
}

}  // namespace

int main(int argc, char* argv[]) {
  std::string_view color_mode = "auto";
  bool show_help = false;
  for (int index = 1; index < argc; ++index) {
    const std::string_view argument(argv[index]);
    if (argument == "--help" || argument == "-h") {
      show_help = true;
    } else if (argument == "--color=auto" || argument == "--color=always" ||
               argument == "--color=never") {
      color_mode = argument.substr(8);
    } else {
      std::cerr << "Usage: codebreaker [--help] [--color=auto|always|never]\n";
      return 1;
    }
  }

  bool use_color = false;
  if (color_mode != "never" &&
      (color_mode == "always" || std::getenv("NO_COLOR") == nullptr)) {
    use_color = EnableTerminalColors();
    if (color_mode == "always") {
      use_color = true;
    }
  }
  if (show_help) {
    PrintHelp(use_color);
    std::cout << "Usage: codebreaker [--help] [--color=auto|always|never]\n";
    return 0;
  }

  try {
    std::random_device seed;
    std::mt19937 generator(seed());
    PrintHelp(use_color);
    while (PlayGame(generator, use_color)) {
      while (true) {
        std::cout << "Play again? [y/n]> " << std::flush;
        std::string input;
        if (!std::getline(std::cin, input)) {
          std::cout << "\nInput closed. Goodbye.\n";
          return 0;
        }
        const auto answer = Trim(input);
        if (answer == "n" || answer == "N" || answer == "quit" ||
            answer == "q") {
          std::cout << "Goodbye.\n";
          return 0;
        }
        if (answer == "y" || answer == "Y") {
          break;
        }
        std::cout << "Enter y or n.\n";
      }
    }
  } catch (const std::exception& error) {
    std::cerr << "Unable to run CodeBreaker: " << error.what() << '\n';
    return 1;
  }
  return 0;
}