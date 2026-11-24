import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const jobs = [
  { html: "ad-single-subscribe.html", out: "anodeh-meta-subscribe-square.png", w: 1080, h: 1080 },
  { html: "ad-single-subscribe-portrait.html", out: "anodeh-meta-subscribe-portrait.png", w: 1080, h: 1350 },
  { html: "ad-developers-sites.html", out: "anodeh-meta-developers-sites-square.png", w: 1080, h: 1080 },
  { html: "ad-developers-sites-portrait.html", out: "anodeh-meta-developers-sites-portrait.png", w: 1080, h: 1350 },
  { html: "ad-square.html", out: "anodeh-meta-feed-square.png", w: 1080, h: 1080 },
  { html: "ad-portrait.html", out: "anodeh-meta-feed-portrait.png", w: 1080, h: 1350 },
];

for (const job of jobs) {
  const htmlPath = resolve(root, job.html);
  const outPath = resolve(root, job.out);
  const url = pathToFileURL(htmlPath).href;
  const args = [
    "15s",
    "google-chrome",
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${job.w},${job.h}`,
    `--screenshot=${outPath}`,
    "--virtual-time-budget=5000",
    url,
  ];
  const result = spawnSync("timeout", args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || `chrome failed for ${job.html}`);
    process.exit(result.status || 1);
  }
  console.log(`wrote ${job.out} (${job.w}x${job.h})`);
}
