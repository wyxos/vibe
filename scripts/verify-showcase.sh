#!/usr/bin/env bash
set -euo pipefail

site=${1:?Expected the built showcase directory}
url=${2:?Expected the public showcase URL}
expected=$(git hash-object "$site/index.html")
deadline=$((SECONDS + 120))

# GitHub accepts the branch push before Pages updates the public domain.
# Allow up to two minutes for this deployment's exact entry point to go live.
while (( SECONDS < deadline )); do
  if live=$(curl --fail --silent --show-error --max-time 10 "$url/?build=$expected" | git hash-object --stdin) &&
    [[ "$live" == "$expected" ]]; then
    echo "Verified the live showcase entry point for build $expected."
    exit 0
  fi
  sleep 5
done

echo "The public showcase did not serve build $expected before the verification deadline." >&2
exit 1
