#!/bin/bash -e

DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")"
cd -P "$DIR"
PKG="$PWD/package"

PATH="$PWD/node_modules/.bin:$PATH"

rm -Rf "${PKG:?}/"*

tsc -p tsconfig.build.json

(cd src && for f in $(find . -type d -name __tests__ -prune -o -type f | grep -v __tests__ ); do cp "$f" "../package/$f"; done)
cp -r doc/ examples/ LICENSE README.md ./package
mkdir -p "${PKG:?}"/bin/
mv "${PKG:?}"/cli.* package/bin/

jq 'del(.devDependencies,.private,.scripts)' "$DIR"/package.json > "${PKG:?}"/package.json
