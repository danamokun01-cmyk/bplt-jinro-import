# Cresd 人狼(オンライン人狼)— Cloudflare Pages + Supabase

登録・ログイン不要のオンライン人狼です。画面は静的ファイル1枚、ゲームの状態・操作・チャットは
**Cresd Chat / Adv Tools と同じ Supabase プロジェクト**に保存・配信します。

## 1. Supabase(Chat と同じプロジェクト)
1. SQL Editor → New query に `supabase/jinro.sql` を丸ごと貼り付けて **Run**(1回だけ。何度実行しても壊れません)。
   作られるテーブルは `jinro_rooms` / `jinro_actions` / `jinro_chat` の3つです。Chat の `messages`、Adv Tools の `link_messages` / `memo_tabs` には触りません。
2. 接続キーは `public/assets/config.js` に **Chat・Adv Tools と同じ値**を入れ済みです(公開してよい anon キー)。`service_role` / `secret` キーは入れないでください。

## 2. デプロイ
    npm install
    npx wrangler login
    npx wrangler pages project create cresd-jinro --production-branch main
    npm run deploy
独自ドメインは Pages → Custom domains で追加します(例: `jinro.cresd.net`)。

## Google
- Search Console の所有権確認ファイル `googlec86113453479ff4e.html` は `functions/` から配信します(Pages の `.html` 転送対策。Chat と同じ方式)。
- Google アナリティクス(`G-73HSKWP1VH`)は `public/index.html` に設置済みです。

## 更新内容(host_settings 版)
- `public/index.html` を `jinro_host_settings (2).html`(ホスト設定・追加役職入り)に差し替えました。
- テーブル名を `jinro_rooms` / `jinro_actions` / `jinro_chat` に変更し、接続情報は `assets/config.js` から読みます。
- このDBは行レベルセキュリティで **DELETE を許可していません**。そのため、画面側からの削除は行わず次のように変えています。
  - 古い部屋・操作ログ・チャットの掃除 → DB側の `jinro_cleanup()`(部屋の作成時に一定確率で実行。`pg_cron` でも可)
  - 6時間以上更新のない部屋に入ったとき → 削除ではなく、その部屋をUPDATEで初期化して再利用
  - 「リセット」時のチャット消去 → 削除せず、部屋の状態に `chatFrom`(境界時刻)を記録し、それ以前の発言を表示しない
  - 処理済みの操作ログ → 削除せず、1日後にDB側が掃除
- 名前は20字、部屋名は40字までに制限(DBの制約に合わせています)。

## データの保持期間
| データ | 保持期間 |
|---|---|
| 部屋(ゲーム状態) | 3日間更新がなければ削除 |
| ホストへの操作ログ | 1日 |
| チャット | 3日(各部屋は新しい200件まで) |
新しい部屋の作成時に一定の確率で自動掃除します。毎日確実に掃除したい場合は `jinro.sql` 末尾の `pg_cron` の2行を有効にしてください。

## 仕様上の注意
- ログイン不要の作りのため、ホスト判定は画面側で行っています。悪意のある人は、公開キーでほかの部屋の状態を書き換えられます。身内向けの利用を想定しています。
- 部屋の状態(`jinro_rooms.state`)には役職などの情報が含まれ、読み取り権限は全員にあります。ブラウザの開発者ツールを使うと他人の役職を見られるため、厳密な公平性が必要な場では使わないでください。
- CSP は設定していません(画面がインラインのスクリプト・`onclick` を使っているため)。

## 更新内容(ゲームUI刷新版)
- UIを全面刷新: 昼/夜/投票/終了ごとに変わる動く背景(星・月・太陽・雲・霧・村のシルエット・蛍・投票時の赤い警告)。自分の陣営で夜空の色味も変化。
- 役職ごとのキャラクター立ち絵(SVG)を自動生成。陣営カラー、狼/狐/猫/犬の耳、フード・シルクハット・兜・光輪・サングラスなど役職別の特徴、胸の紋章、瞬き・耳ピク・浮遊アニメ付き。
- 役職配布時に立ち絵が飛び出す演出、画面上部の「あなたの役職」カード、役職辞典・参加者一覧にも立ち絵/アバター表示(他人の役職は終了まで非表示)。
- バランス既定値の調整(ホストのルール設定で元に戻せます): 初日夜の占い=ランダム白のお告げ / キューピッドは恋人が勝利したときのみ勝利 / スペランカーの死亡率 10%→8%。
- 通信・DB・ゲーム進行ロジックは従来のまま(`supabase/jinro.sql` の再実行は不要)。
