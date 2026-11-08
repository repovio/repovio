#!/bin/sh
# Check index isolation, failure handling, and skip paths without invoking an LLM.
set -eu

hook_directory=$(CDPATH= cd "$(dirname "$0")" && pwd)
test_root=$(mktemp -d "${TMPDIR:-/tmp}/graphify-hook-test.XXXXXX")
trap 'rm -rf "$test_root"' 0
trap 'exit 1' HUP INT TERM
git init -q "$test_root/repo"
cd "$test_root/repo"
git config user.name 'Graphify hook test'
git config user.email 'graphify-test@example.invalid'
git config core.hooksPath /dev/null
mkdir graphify-out
echo seed > graphify-out/graph.json
echo baseline > source.txt
git add .
git commit -qm baseline

cat > "$test_root/python" <<'MOCK'
#!/bin/sh
set -eu
test "$*" = '-m graphify update .'
test "$PYTHONHASHSEED" = 0
test ! -e untracked.txt
echo called >> "$GRAPHIFY_TEST_MARKER"
if [ "${GRAPHIFY_TEST_FAIL:-0}" = 1 ]; then exit 1; fi
cat source.txt > graphify-out/graph.json
MOCK
chmod +x "$test_root/python"
git config graphify.python "$test_root/python"
export GRAPHIFY_TEST_MARKER="$test_root/calls"

"$hook_directory/pre-commit"
test ! -e "$GRAPHIFY_TEST_MARKER"
echo graph-only > graphify-out/graph.json
git add graphify-out/graph.json
"$hook_directory/pre-commit"
test ! -e "$GRAPHIFY_TEST_MARKER"
git reset -q HEAD -- graphify-out/graph.json
echo seed > graphify-out/graph.json

echo staged > source.txt
git add source.txt
echo unstaged > source.txt
echo private > untracked.txt
GRAPHIFY_SKIP_HOOK=1 "$hook_directory/pre-commit"
test ! -e "$GRAPHIFY_TEST_MARKER"
if GRAPHIFY_TEST_FAIL=1 "$hook_directory/pre-commit"; then exit 1; fi
test "$(cat graphify-out/graph.json)" = seed
test "$(git show :graphify-out/graph.json)" = seed
"$hook_directory/pre-commit"
test "$(git show :graphify-out/graph.json)" = staged
test "$(git show :source.txt)" = staged
test "$(cat source.txt)" = unstaged
test "$(cat untracked.txt)" = private
test "$(wc -l < "$GRAPHIFY_TEST_MARKER" | tr -d ' ')" = 2
git diff --cached --quiet -- ':!source.txt' ':!graphify-out/graph.json'

git config --unset graphify.python
if "$hook_directory/pre-commit"; then exit 1; fi
echo 'Graphify pre-commit tests passed.'
