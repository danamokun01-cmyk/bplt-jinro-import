// Google Search Console の所有権確認ファイル。
// Pages は「.html で終わるURL」を拡張子なしへ転送してしまい確認に失敗するため、Functions で元のURLのまま直接返します。
// (このURLにだけ Functions が動きます。ほかのページは静的ファイルのままです)
export function onRequestGet() {
  return new Response("google-site-verification: googlec86113453479ff4e.html", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
