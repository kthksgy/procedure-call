# コンパイル対象のディレクトリ名
# `packages`ディレクトリ内のディレクトリ名を指定すると、この順でコンパイルを行う。
DIRECTORY_NAMES=('main' 'react-native-web-view' 'service-worker')

for DIRECTORY_NAME in ${DIRECTORY_NAMES[@]};
do
  echo "\"${DIRECTORY_NAME}\"パッケージのコンパイルを行います。"
  (cd packages/${DIRECTORY_NAME} && tsc --noEmit)
done

echo "ESLintを実行します。"
eslint .
