# AI搭載型TOEIC対策学習アプリ (TOEIC Preparation AI Assistant)

## 📖 プロジェクト概要
生成AIを活用することで、固定された過去問を解くだけでなく、自身のニーズに合わせた問題を無限に生成し、苦手克服のサイクルを効率化することを目的としています。

### 📺 動作デモ
![demo2](https://github.com/user-attachments/assets/45323de8-a9df-44eb-a6a6-cc6d4d789078)


## ✨ 主な機能 (Core Modules)

### 1. Part 7：長文読解 & インタラクティブ辞書
* **問題生成:** クリックするたびに、TOEIC Part 7形式の新しい読解問題が自動生成されます。
* **即時辞書機能:** 読解中の不明な単語をタップするだけで、AIが即座に意味を表示します。
* **My単語帳:** 検索した単語は自動的に「My単語帳」へ保存され、後からの復習が可能です。

### 2. Part 3：リスニング & 柔軟な音声合成(TTS)
* **スクリプト生成:** Part 3形式のリスニング問題（会話文）を動的に生成します。
* **マルチ音声設定:** TTS（Text-to-Speech）技術を実装し、音声の性別（男性・女性）を自由に選択可能です。本番に近い環境での練習をサポートします。

### 3. ライティング練習
* **トピック生成:** 自由記述や意見表明のためのライティングトピックを自動生成。日々のスキルアップに活用できます。

### 4. 模擬試験モード（プロトタイプ）
* **実践形式:** Part 7を中心とした模擬試験機能。現在はプロトタイプとして、長文読解の集中トレーニングに特化しています。

## 🛠 技術スタック (Tech Stack)
* **Frontend:** React, TypeScript
* **AI Engine:** Google Gemini API (via AI Studio)
* **Audio:** Web Speech API / Cloud TTS
* **Architecture:** Component-based UI

## 🚀 今後の展望 (Future Improvements)
* **全パートの網羅:** 現在の読解・リスニング機能に加え、Part 1~6の全形式への対応。
* **学習データ分析:** 模擬試験時の解答時間計測や、正答率に基づく苦手傾向の可視化。
* **データベース連携:** 「My単語帳」の永続化と、過去の学習履歴の管理機能。

---
## Run Locally
**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
