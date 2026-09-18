import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("customer demo is explicitly non-production and inspectable", async () => {
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  assert.match(html, /DEMO MODE/);
  assert.match(html, /لا يوجد طلب حقيقي/);
  assert.match(html, /Image is preview-only/);
  assert.match(html, /لا يتم حفظها أو نشرها/);
  assert.match(html, /Product DNA \/ evidence/);
});

test("customer demo does not claim that image analysis occurred", async () => {
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  assert.match(html, /لا يقوم.*تحليل|does not analyze/i);
});
