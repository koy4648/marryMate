import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("https://wedget.example/", {
      headers: { accept: "text/html", host: "wedget.example", "x-forwarded-proto": "https" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Marry Mate venue tour app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Marry Mate · 함께 준비하는 웨딩 플래너/);
  assert.match(html, /웨딩홀부터 예산, 업체와 일정까지/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("ships an installable local-first manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.short_name, "Marry Mate");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/venues");
});
