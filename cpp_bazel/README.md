# CodeBreaker

A C++17 text UI game using standard input and standard output, built with Bazel.
ANSI terminal colors display each peg as a colored tile containing its number.
No terminal UI libraries or runtime dependencies are required.

## Prerequisites

1. Install [Bazelisk](https://github.com/bazelbuild/bazelisk#installation),
    the recommended Bazel launcher. It reads `.bazelversion` and selects Bazel
    8.4.0 automatically. Alternatively, install Bazel 8.4.0 directly.
2. Install a C++17 toolchain:
    - Windows: Visual Studio 2022 C++ build tools and the Windows SDK. If Bazel
      cannot find the compiler, use an x64 Native Tools Command Prompt for Visual
      Studio.
    - Linux or macOS: GCC or Clang.
3. Keep an internet connection available for the first build so Bazelisk and
    Bazel can download Bazel and the build dependencies.

The commands below use `bazel` as the launcher name. If your Bazelisk
installation is named `bazelisk`, use `bazelisk` in place of `bazel`.

## Build and Run the Game

1. Open a terminal at the repository root, then change to this directory:

   ```sh
   cd cpp_bazel
   ```

   In PowerShell, the equivalent command is `cd .\cpp_bazel`.
2. (Optional) Check the selected Bazel version:

   ```sh
   bazel --version
   ```

   With Bazelisk, the output should report `bazel 8.4.0`.
3. Compile the game:

   ```sh
   bazel build //:codebreaker
   ```

   The executable is written to `bazel-bin`. The first build may take longer
   while Bazel downloads dependencies.
4. Start the game with Bazel:

   ```sh
   bazel run //:codebreaker
   ```

   Or run the compiled executable directly:

   ```sh
   # Linux/macOS
   ./bazel-bin/codebreaker
   ```

   ```powershell
   # Windows PowerShell
   .\bazel-bin\codebreaker.exe
   ```

To print the rules without starting a game, run `bazel run //:codebreaker -- --help`.

The computer generates a random secret of four colors, represented by digits
`1` through `6`. Colors may repeat. You have ten valid guesses to find the code.

| Number | Color |
| --- | --- |
| 1 | Red |
| 2 | Green |
| 3 | Yellow |
| 4 | Blue |
| 5 | Magenta |
| 6 | Cyan |

The legend, submitted guesses, and revealed secret all use the same colored,
numbered pegs. Input remains numeric, and numbers remain visible in every mode.

- Enter four digits, for example `1234` or `1 2 3 4`.
- **Exact** counts colors in the correct position.
- **Misplaced** counts correct colors in other positions. Each secret peg and
  guessed peg can contribute to at most one match, including repeated colors.
- Invalid input does not consume an attempt.
- Enter `help` (or `h`) to see the rules without consuming an attempt.
- Enter `quit` (or `q`) to reveal the secret and exit.
- After winning or using all ten attempts, enter `y` to play again or `n` to exit.
- End-of-file exits cleanly, including when input is piped or redirected.

For example, with secret `1123` and guess `1211`, the feedback is
`Exact: 1 | Misplaced: 2`.

### Terminal Colors

Color defaults to `--color=auto`: it is enabled for supported terminals and
disabled when output is redirected, `NO_COLOR` is set, or the terminal cannot
display ANSI colors. On Windows, virtual-terminal processing is enabled when
available; Windows Terminal and the VS Code integrated terminal support it.

```sh
bazel run //:codebreaker -- --color=always
bazel run //:codebreaker -- --color=never
```

`always` emits ANSI escape sequences even when piping output; `never` uses
plain numbered pegs, such as `[1] [2] [3] [4]`. An explicit `always` overrides
`NO_COLOR`. Each colored peg resets the terminal style after its number.

## Build and Run Tests

Run these commands from `cpp_bazel`, as in the game setup steps above.

1. Compile the test executable:

   ```sh
   bazel build //:codebreaker_test
   ```

   This creates `bazel-bin/codebreaker_test` (`bazel-bin\codebreaker_test.exe`
   on Windows).
2. Run the tests through Bazel, which builds the target if needed and reports
   failures:

   ```sh
   bazel test //:codebreaker_test --test_output=errors
   ```

   A successful run ends with `//:codebreaker_test` passing.
3. To launch the compiled test executable directly instead, use:

   ```sh
   # Linux/macOS
   ./bazel-bin/codebreaker_test
   ```

   ```powershell
   # Windows PowerShell
   .\bazel-bin\codebreaker_test.exe
   ```

Tests cover exact and misplaced matches, repeated-color scoring, whitespace,
invalid lengths, invalid colors, and colored/plain peg rendering. Game rules
and rendering are in `inc/codebreaker.h` and `src/codebreaker.cc`; interactive
console I/O and terminal detection are in `src/main.cc`.

## Project Structure

- `src/`: implementation sources (`main.cc` and `codebreaker.cc`).
- `inc/`: public headers (`codebreaker.h`).
- `test/`: test sources (`codebreaker_test.cc`).
- `BUILD.bazel`: game, library, and test targets.
