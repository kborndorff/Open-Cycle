const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const outDir = path.join(root, "store-assets", "play");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(name, content) {
  fs.writeFileSync(path.join(outDir, name), `${content.trim()}\n`, "utf8");
}

function logoSvg(x, y, size) {
  const scale = size / 280;
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="140" cy="140" r="132" fill="#edf1f7" />
      <circle cx="140" cy="140" r="104" fill="#ffffff" fill-opacity="0.92" />
      <circle cx="140" cy="140" r="100" stroke="#6d7e96" stroke-width="9" fill="none" />
      <circle cx="140" cy="140" r="16" fill="#6d7e96" />
      <circle cx="220" cy="140" r="13" fill="#4f607f" />
      <circle cx="60" cy="140" r="13" fill="#4f607f" />
      <circle cx="140" cy="60" r="13" fill="#4f607f" />
      <circle cx="140" cy="220" r="13" fill="#4f607f" />
      <path d="M140 140L140 60" stroke="#4f607f" stroke-width="8" stroke-linecap="round" />
      <path d="M140 140L220 140" stroke="#4f607f" stroke-width="8" stroke-linecap="round" />
      <path d="M140 140L98 98" stroke="#4f607f" stroke-width="7" stroke-linecap="round" />
      <path d="M140 140L182 182" stroke="#4f607f" stroke-width="7" stroke-linecap="round" />
      <circle cx="140" cy="140" r="52" stroke="#9aaec7" stroke-width="6" stroke-dasharray="6 10" />
    </g>`;
}

function featureGraphic() {
  return `
    <svg width="1024" height="500" viewBox="0 0 1024 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="500" fill="#edf1f7" />
      <path d="M0 430 C170 365 310 390 454 335 C610 275 748 210 1024 248 V500 H0 Z" fill="#dfe7f1" />
      <path d="M0 78 C164 123 268 74 402 102 C556 134 694 226 1024 164 V0 H0 Z" fill="#f8fafc" opacity="0.82" />
      ${logoSvg(84, 86, 328)}
      <text x="468" y="188" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="58" font-weight="700">open-cycle</text>
      <text x="470" y="250" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="30" font-weight="600">Free local cycle tracking</text>
      <text x="470" y="306" fill="#3d4b61" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="24">No account. No hidden tracking. No cloud sync.</text>
      <rect x="470" y="354" width="238" height="46" rx="8" fill="#4f668d" />
      <text x="589" y="385" text-anchor="middle" fill="#ffffff" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="20" font-weight="700">Truly local</text>
    </svg>`;
}

function appIcon() {
  return `
    <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="36" y="36" width="440" height="440" rx="96" fill="#edf1f7" />
      <circle cx="256" cy="244" r="158" fill="#ffffff" fill-opacity="0.94" />
      <circle cx="256" cy="244" r="144" stroke="#6d7e96" stroke-width="16" fill="none" />
      <circle cx="256" cy="244" r="24" fill="#6d7e96" />
      <circle cx="368" cy="244" r="18" fill="#4f607f" />
      <circle cx="144" cy="244" r="18" fill="#4f607f" />
      <circle cx="256" cy="132" r="18" fill="#4f607f" />
      <circle cx="256" cy="356" r="18" fill="#4f607f" />
      <path d="M256 244L256 132" stroke="#4f607f" stroke-width="14" stroke-linecap="round" />
      <path d="M256 244L368 244" stroke="#4f607f" stroke-width="14" stroke-linecap="round" />
      <path d="M256 244L196 184" stroke="#4f607f" stroke-width="12" stroke-linecap="round" />
      <path d="M256 244L316 304" stroke="#4f607f" stroke-width="12" stroke-linecap="round" />
      <circle cx="256" cy="244" r="76" stroke="#9aaec7" stroke-width="10" stroke-dasharray="10 16" />
      <text x="256" y="424" text-anchor="middle" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="34" font-weight="800">CORE</text>
    </svg>`;
}

function phoneFrame(inner) {
  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1920" fill="#edf1f7" />
      <rect x="118" y="72" width="844" height="1776" rx="58" fill="#26324a" />
      <rect x="146" y="112" width="788" height="1696" rx="38" fill="#f7f9fc" />
      <rect x="432" y="88" width="216" height="22" rx="11" fill="#52637f" />
      ${inner}
    </svg>`;
}

function screenshotLog() {
  return phoneFrame(`
      ${logoSvg(202, 176, 172)}
      <text x="404" y="246" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="54" font-weight="700">open-cycle</text>
      <text x="404" y="304" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Cycle entries stay on your device.</text>
      <rect x="206" y="430" width="668" height="330" rx="18" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="502" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="38" font-weight="700">Your cycle log</text>
      <rect x="250" y="548" width="280" height="72" rx="10" fill="#eef2fa" stroke="#cfd7e6" />
      <rect x="552" y="548" width="280" height="72" rx="10" fill="#eef2fa" stroke="#cfd7e6" />
      <rect x="250" y="642" width="582" height="72" rx="10" fill="#4f668d" />
      <text x="541" y="688" text-anchor="middle" fill="#ffffff" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26" font-weight="700">Save entry</text>
      <rect x="206" y="820" width="668" height="164" rx="18" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="888" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="34" font-weight="700">Medium flow</text>
      <text x="250" y="940" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="25">Cramps - calm</text>
      <rect x="206" y="1020" width="668" height="164" rx="18" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="1088" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="34" font-weight="700">Light flow</text>
      <text x="250" y="1140" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="25">Headache - tired</text>
      <rect x="206" y="1284" width="668" height="190" rx="18" fill="#eaf1e8" stroke="#9ec29e" />
      <text x="250" y="1360" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="32" font-weight="700">No internet needed</text>
      <text x="250" y="1412" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="24">Saved entries stay on your phone.</text>
    `);
}

function screenshotPrivacy() {
  return phoneFrame(`
      <text x="206" y="230" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="56" font-weight="700">Simple entries</text>
      <text x="206" y="292" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Track cycles without accounts.</text>
      <rect x="206" y="402" width="300" height="180" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="248" y="480" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Entries</text>
      <text x="248" y="540" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="46" font-weight="700">4</text>
      <rect x="574" y="402" width="300" height="180" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="616" y="480" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Latest</text>
      <text x="616" y="540" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="46" font-weight="700">Today</text>
      <rect x="206" y="704" width="668" height="250" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="786" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="36" font-weight="700">Local by design</text>
      <text x="250" y="844" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">No signup, ads, hidden tracking, or cloud sync.</text>
      <text x="250" y="900" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Your cycle log remains on your device.</text>
      <rect x="206" y="1080" width="668" height="250" rx="20" fill="#eef2fa" stroke="#cfd7e6" />
      ${logoSvg(394, 1116, 292)}
    `);
}

function screenshotReview() {
  return phoneFrame(`
      <text x="206" y="230" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="54" font-weight="700">Review entries</text>
      <text x="206" y="292" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">See recent cycle history at a glance.</text>
      <rect x="206" y="386" width="668" height="162" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="452" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="34" font-weight="700">Medium flow</text>
      <text x="250" y="504" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="25">Cramps, low back pain - calm</text>
      <rect x="206" y="584" width="668" height="162" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="650" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="34" font-weight="700">Light flow</text>
      <text x="250" y="702" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="25">Headache - tired</text>
      <rect x="206" y="782" width="668" height="162" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="848" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="34" font-weight="700">Heavy flow</text>
      <text x="250" y="900" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="25">Fatigue - resting</text>
      <rect x="206" y="1080" width="668" height="116" rx="16" fill="#eef2fa" stroke="#cfd7e6" />
      <text x="540" y="1152" text-anchor="middle" fill="#40516d" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="30" font-weight="700">Edit flow</text>
      <rect x="206" y="1232" width="668" height="116" rx="16" fill="#f8ecec" stroke="#e3b8b8" />
      <text x="540" y="1304" text-anchor="middle" fill="#6f2d2d" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="30" font-weight="700">Delete one entry</text>
    `);
}

function screenshotClearAll() {
  return phoneFrame(`
      <text x="206" y="230" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="54" font-weight="700">User controls</text>
      <text x="206" y="292" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Delete entries from this device.</text>
      <rect x="206" y="402" width="668" height="250" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="250" y="482" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="38" font-weight="700">Total entries: 4</text>
      <text x="250" y="548" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Latest entry: today</text>
      <rect x="250" y="598" width="582" height="1" fill="#d8deea" />
      <text x="250" y="748" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="36" font-weight="700">Clear all local entries</text>
      <rect x="206" y="888" width="668" height="236" rx="20" fill="#eaf1e8" stroke="#9ec29e" />
      <text x="250" y="968" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="34" font-weight="700">Private by default</text>
      <text x="250" y="1026" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">No ads, accounts, hidden tracking,</text>
      <text x="250" y="1074" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">or cloud sync in the core app.</text>
    `);
}

function tabletFrame(width, height, inner) {
  const scale = width / 1920;
  const scaledHeight = 1080 * scale;
  const yOffset = (height - scaledHeight) / 2;
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#edf1f7" />
      <g transform="translate(0 ${yOffset}) scale(${scale})">
        <rect x="78" y="64" width="1764" height="952" rx="42" fill="#26324a" />
        <rect x="114" y="102" width="1692" height="876" rx="28" fill="#f7f9fc" />
        <rect x="846" y="80" width="228" height="18" rx="9" fill="#52637f" />
        ${inner}
      </g>
    </svg>`;
}

function tabletDashboard() {
  return `
      <text x="180" y="210" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="62" font-weight="700">open-cycle</text>
      <text x="180" y="278" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="30">A quiet private period log for larger screens.</text>
      <rect x="180" y="372" width="440" height="210" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="230" y="454" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Entries</text>
      <text x="230" y="530" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="64" font-weight="700">4</text>
      <rect x="680" y="372" width="440" height="210" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="730" y="454" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Latest entry</text>
      <text x="730" y="530" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="64" font-weight="700">Today</text>
      <rect x="1180" y="372" width="440" height="210" rx="20" fill="#eaf1e8" stroke="#9ec29e" />
      <text x="1230" y="454" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Network</text>
      <text x="1230" y="530" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="54" font-weight="700">None</text>
      <rect x="180" y="668" width="1440" height="190" rx="22" fill="#ffffff" stroke="#d8deea" />
      <text x="236" y="752" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="40" font-weight="700">Your cycle log</text>
      <text x="236" y="812" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Save dates, flow, symptoms, moods, and notes directly on your device.</text>
    `;
}

function tabletEntry() {
  return `
      <text x="180" y="210" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="62" font-weight="700">Add a cycle entry</text>
      <text x="180" y="278" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="30">Simple fields, no account, no cloud sync.</text>
      <rect x="180" y="370" width="1440" height="430" rx="22" fill="#ffffff" stroke="#d8deea" />
      <rect x="250" y="452" width="390" height="84" rx="10" fill="#eef2fa" stroke="#cfd7e6" />
      <text x="280" y="505" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Date</text>
      <rect x="700" y="452" width="390" height="84" rx="10" fill="#eef2fa" stroke="#cfd7e6" />
      <text x="730" y="505" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Flow</text>
      <rect x="1150" y="452" width="390" height="84" rx="10" fill="#eef2fa" stroke="#cfd7e6" />
      <text x="1180" y="505" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Mood</text>
      <rect x="250" y="604" width="1290" height="90" rx="10" fill="#eef2fa" stroke="#cfd7e6" />
      <text x="280" y="660" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Symptoms and notes</text>
      <rect x="250" y="720" width="390" height="72" rx="10" fill="#4f668d" />
      <text x="445" y="767" text-anchor="middle" fill="#ffffff" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="27" font-weight="700">Save entry</text>
    `;
}

function tabletReview() {
  return `
      <text x="180" y="210" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="62" font-weight="700">Review and edit</text>
      <text x="180" y="278" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="30">Recent entries are easy to scan on larger displays.</text>
      <rect x="180" y="372" width="1440" height="150" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="238" y="438" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="36" font-weight="700">Medium flow</text>
      <text x="238" y="490" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Cramps, calm mood, evening note</text>
      <rect x="180" y="554" width="1440" height="150" rx="20" fill="#ffffff" stroke="#d8deea" />
      <text x="238" y="620" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="36" font-weight="700">Light flow</text>
      <text x="238" y="672" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="26">Headache, tired mood</text>
      <rect x="180" y="778" width="620" height="88" rx="14" fill="#eef2fa" stroke="#cfd7e6" />
      <text x="490" y="834" text-anchor="middle" fill="#40516d" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28" font-weight="700">Edit selected entry</text>
      <rect x="866" y="778" width="620" height="88" rx="14" fill="#f8ecec" stroke="#e3b8b8" />
      <text x="1176" y="834" text-anchor="middle" fill="#6f2d2d" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28" font-weight="700">Delete one entry</text>
    `;
}

function tabletPrivacy() {
  return `
      <text x="180" y="210" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="62" font-weight="700">Private by default</text>
      <text x="180" y="278" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="30">Local controls for clearing data from the app.</text>
      <rect x="180" y="386" width="680" height="360" rx="24" fill="#eaf1e8" stroke="#9ec29e" />
      <text x="240" y="480" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="40" font-weight="700">No ads or hidden tracking</text>
      <text x="240" y="546" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">No signup, tracking SDKs,</text>
      <text x="240" y="596" fill="#245126" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">analytics, or cloud sync.</text>
      <rect x="940" y="386" width="680" height="360" rx="24" fill="#ffffff" stroke="#d8deea" />
      <text x="1000" y="480" fill="#27324a" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="40" font-weight="700">Clear all local entries</text>
      <text x="1000" y="546" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">Delete entries on this device</text>
      <text x="1000" y="596" fill="#4f607f" font-family="Avenir Next, Avenir, Trebuchet MS, sans-serif" font-size="28">from inside the app.</text>
    `;
}

ensureDir(outDir);
write("app-icon.svg", appIcon());
write("feature-graphic.svg", featureGraphic());
write("phone-screenshot-1.svg", screenshotLog());
write("phone-screenshot-2.svg", screenshotPrivacy());
write("phone-screenshot-3.svg", screenshotReview());
write("phone-screenshot-4.svg", screenshotClearAll());
write("tablet-7-screenshot-1.svg", tabletFrame(1920, 1080, tabletDashboard()));
write("tablet-7-screenshot-2.svg", tabletFrame(1920, 1080, tabletEntry()));
write("tablet-7-screenshot-3.svg", tabletFrame(1920, 1080, tabletReview()));
write("tablet-7-screenshot-4.svg", tabletFrame(1920, 1080, tabletPrivacy()));
write("tablet-10-screenshot-1.svg", tabletFrame(2560, 1440, tabletDashboard()));
write("tablet-10-screenshot-2.svg", tabletFrame(2560, 1440, tabletEntry()));
write("tablet-10-screenshot-3.svg", tabletFrame(2560, 1440, tabletReview()));
write("tablet-10-screenshot-4.svg", tabletFrame(2560, 1440, tabletPrivacy()));

console.log(`Generated Play Store asset sources in ${outDir}`);
