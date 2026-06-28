(() => {
  const query = new URLSearchParams(window.location.search);
  const redirectTo = "https://local-cycle.com";
  const nextLink = document.getElementById("open-cycle-upgrade-link");
  if (nextLink) {
    nextLink.setAttribute("href", redirectTo);
  }
  let seconds = 8;
  const timer = setInterval(() => {
    const el = document.getElementById("count");
    if (el) {
      el.textContent = String(seconds);
    }
    if (seconds <= 0) {
      clearInterval(timer);
      window.location.href = redirectTo;
    }
    seconds -= 1;
  }, 1000);

  setTimeout(() => {
    clearInterval(timer);
    window.location.href = redirectTo;
  }, 9000);
})();
