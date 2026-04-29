# Box Note to Markdown Chrome Extension

Box NoteをMarkdown形式に変換するChrome拡張機能です。

## 機能

- **Box NoteをMarkdownに変換**: アクティブなBox Noteページからコンテンツを抽出してMarkdownに変換します。
- **プレビュー**: 生成されたMarkdownをポップアップウィンドウで確認できます。
- **クリップボードにコピー**: ワンクリックでコピーできます。
- **ファイルとして保存**: 結果を`.md`ファイルとしてダウンロードできます。

## インストール方法

1.  このリポジトリをクローンするか、ソースコードをダウンロードします。
2.  Chromeを開き、`chrome://extensions` にアクセスします。
3.  右上の **デベロッパー モード** を有効にします。
4.  **パッケージ化されていない拡張機能を読み込む** をクリックします。
5.  このプロジェクトの `src` ディレクトリを選択します。

## 使い方

1.  `box.com` の Box Note ページに移動します。
2.  ツールバーの拡張機能アイコンをクリックします。
3.  **Convert to Markdown** をクリックします。
4.  **Copy** または **Save** ボタンを使用してコンテンツをエクスポートします。

## 開発

- `src/manifest.json`: 拡張機能の設定ファイル。
- `src/content.js`: ページからデータを抽出してMarkdownに変換するロジック。
- `src/popup.html` & `src/popup.js`: 拡張機能のポップアップインターフェース。
- `src/styles.css`: ポップアップのスタイル。

## ライセンス

MIT
