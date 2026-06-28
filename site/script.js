const legacyHosts = new Set(["open-cycle.com", "www.open-cycle.com"]);
const upgradePaths = new Set([
  "/features",
  "/features/",
  "/pro",
  "/pro/",
  "/upgrade",
  "/upgrade/",
  "/pricing",
  "/pricing/"
]);
const path = window.location.pathname.toLowerCase();
const host = window.location.hostname.toLowerCase();
const upgradeAnchor = document.getElementById("open-cycle-link");
const upgradeLandingPath = "/open-cycle.html";

if (legacyHosts.has(host) && upgradeAnchor) {
  upgradeAnchor.textContent = "View Local Cycle features";
}

if (legacyHosts.has(host) && upgradePaths.has(path)) {
  const legacyMsg = document.getElementById("legacy-note");
  if (legacyMsg) {
    legacyMsg.textContent = "You are on a feature route. Redirecting gently to Local Cycle.";
  }
  const target = `${window.location.origin}${upgradeLandingPath}?next=${encodeURIComponent(path)}`;
  const fallbackTarget = target;
  let countdown = 8;

  const container = document.createElement("p");
  const span = document.createElement("strong");
  span.textContent = String(countdown);
  const link = document.createElement("a");
  const timerLink = document.createElement("a");

  container.textContent = "You will be redirected to Local Cycle in ";
  container.appendChild(span);

  link.href = target;
  link.textContent = "Continue to Local Cycle";
  link.className = "button";
  link.setAttribute("rel", "noopener noreferrer");

  timerLink.textContent = "If you prefer to stay here, continue here.";
  timerLink.href = fallbackTarget;
  timerLink.style.display = "inline-block";
  timerLink.style.marginTop = "8px";
  timerLink.style.color = "#4f668d";

  const mount = document.querySelector(".site-shell");
  if (mount) {
    mount.append(container);
    mount.append(link);
    mount.append(timerLink);
  }

  const timer = setInterval(() => {
    countdown -= 1;
    span.textContent = String(countdown);
    if (countdown <= 0) {
      clearInterval(timer);
      window.location.href = target;
    }
  }, 1000);

  setTimeout(() => {
    clearInterval(timer);
    window.location.href = target;
  }, 9000);
}

if (legacyHosts.has(host) && ["/", "/index.html"].includes(path)) {
  const upgradeAnchorCopy = document.getElementById("open-cycle-link");
  if (upgradeAnchorCopy) {
    upgradeAnchorCopy.href = "https://local-cycle.com";
    upgradeAnchorCopy.textContent = "View Local Cycle features";
  }
}
