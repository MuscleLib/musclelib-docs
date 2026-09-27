document.addEventListener("DOMContentLoaded", () => {
  // Footer year (docs pages)
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Used by inline onclick="selectText(this)" in templates
  window.selectText = (element) => {
    if (!element) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Copy code buttons
  document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.nextElementSibling;
      if (!code) return;

      navigator.clipboard.writeText(code.textContent).then(() => {
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          button.innerHTML = '<i class="fa-solid fa-copy"></i>';
        }, 1000);
      });
    });
  });

  // Response example tabs: keep "active" styling per group
  document.querySelectorAll(".all-200, .all-400").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.getAttribute("data-group");
      if (!group) return;

      document.querySelectorAll(`[data-group="${group}"]`).forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");
    });
  });

  // Persist active sublink (left navigation)
  const sublinks = document.querySelectorAll(".nav-link.sublink");
  const activeLinkId = localStorage.getItem("activeLink");

  if (activeLinkId) {
    const activeLink = document.querySelector(`.nav-link.sublink[href="${activeLinkId}"]`);
    if (activeLink) {
      sublinks.forEach((link) => link.classList.remove("active"));
      activeLink.classList.add("active");

      const target = document.querySelector(activeLinkId);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }
  }

  sublinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      sublinks.forEach((sub) => sub.classList.remove("active"));
      link.classList.add("active");

      const targetId = link.getAttribute("href");
      if (!targetId) return;

      localStorage.setItem("activeLink", targetId);
      const target = document.querySelector(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth" });

      // Close the drawer on mobile after navigation
      const offcanvasEl = document.getElementById("offcanvasNested");
      if (offcanvasEl && window.innerWidth < 992 && typeof bootstrap !== "undefined") {
        const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (instance) instance.hide();
      }
    });
  });
});
