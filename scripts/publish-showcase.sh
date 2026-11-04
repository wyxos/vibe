#!/usr/bin/env bash
set -euo pipefail

site=$(cd "${1:?Expected the built showcase directory}" && pwd)
test -s "$site/index.html"
branch=refs/heads/gh-pages
tracking_ref=refs/remotes/origin/gh-pages
git fetch --no-tags origin "$branch:$tracking_ref"
base=$(git rev-parse "$tracking_ref")

worktree=$(mktemp -d)
cleanup() {
  git worktree remove --force "$worktree"
}
git worktree add --detach "$worktree" "$base"
trap cleanup EXIT
git -C "$worktree" rm -qr -- .
cp -a "$site/." "$worktree/"
touch "$worktree/.nojekyll"
git -C "$worktree" add --all
tree=$(git -C "$worktree" write-tree)

if [[ $(git rev-parse "$base^{tree}") != "$tree" ]]; then
  git -C "$worktree" -c user.name='github-actions[bot]' \
    -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
    commit -qm "Deploy showcase from $(git rev-parse HEAD)"
  deploy=$(git -C "$worktree" rev-parse HEAD)

  if output=$(git push origin "$deploy:$branch" 2>&1); then
    printf '%s\n' "$output"
  else
    printf '%s\n' "$output" >&2
    # A failed response can arrive after GitHub has already accepted the push.
    git fetch --no-tags origin "$branch:$tracking_ref"
    current=$(git rev-parse "$tracking_ref")
    if [[ $(git rev-parse "$current^{tree}") == "$tree" ]]; then
      echo 'The intended showcase is already on the Pages branch.'
    elif [[ "$current" == "$base" ]] && grep -Eiq \
      'fatal error in commit_refs|requested URL returned error: (500|502|503|504)|connection reset|operation timed out|could not resolve host|remote end hung up' <<< "$output"; then
      echo 'Retrying the Pages push once with the same commit.'
      git push origin "$deploy:$branch"
    else
      echo 'Pages push could not be recovered safely.' >&2
      exit 1
    fi
  fi
fi

git fetch --no-tags origin "$branch:$tracking_ref"
test "$(git rev-parse "$tracking_ref^{tree}")" = "$tree"
