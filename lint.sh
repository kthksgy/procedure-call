#!/bin/bash -ue
# ドライランコンパイル対象のディレクトリ名
DIRECTORY_NAMES=('main' 'react-native-web-view' 'service-worker')

# `packages`ディレクトリを指定された順でドライランコンパイルする。
for DIRECTORY_NAME in ${DIRECTORY_NAMES[@]};
do
  echo "\"${DIRECTORY_NAME}\"パッケージのコンパイルを行います。"
  (cd packages/${DIRECTORY_NAME} && tsc --noEmit)
done

echo "ESLintを実行します。"
eslint .
