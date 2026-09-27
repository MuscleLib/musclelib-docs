document.addEventListener("DOMContentLoaded", () => {
  // Footer year (docs pages)
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const navigationDrawer = document.getElementById("offcanvasNested");
  const navigationToggle = document.querySelector(".docs-menu-trigger");

  if (navigationDrawer && navigationToggle) {
    navigationDrawer.addEventListener("show.bs.offcanvas", () => {
      navigationToggle.setAttribute("aria-expanded", "true");
    });

    navigationDrawer.addEventListener("hidden.bs.offcanvas", () => {
      navigationToggle.setAttribute("aria-expanded", "false");
    });
  }

  const currentLanguage = document.documentElement.lang;
  const countryFlagClass = { en: "fi-us", es: "fi-es", pt: "fi-br" };

  document.querySelectorAll(".language-menu [data-lang]").forEach((link) => {
    if (link.dataset.lang === currentLanguage) {
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll("[data-current-country-flag]").forEach((flag) => {
    flag.classList.add(countryFlagClass[currentLanguage] || "fi-us");
  });

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

  const sectionLinks = Array.from(
    document.querySelectorAll('.nested-link[href^="#item-"]:not([data-bs-toggle="collapse"])'),
  );

  const setActiveSectionLink = (link) => {
    sectionLinks.forEach((sectionLink) => {
      sectionLink.classList.toggle("active", sectionLink === link);
      if (sectionLink === link) {
        sectionLink.setAttribute("aria-current", "location");
      } else {
        sectionLink.removeAttribute("aria-current");
      }
    });

    const parentCollapse = link.closest(".collapse");
    if (
      parentCollapse &&
      !parentCollapse.classList.contains("show") &&
      typeof bootstrap !== "undefined"
    ) {
      bootstrap.Collapse.getOrCreateInstance(parentCollapse, { toggle: false }).show();
    }

    localStorage.setItem("activeLink", link.getAttribute("href"));
  };

  const activeLinkId = localStorage.getItem("activeLink");
  const savedActiveLink = sectionLinks.find(
    (link) => link.getAttribute("href") === activeLinkId,
  );

  if (savedActiveLink) {
    setActiveSectionLink(savedActiveLink);
    document.querySelector(activeLinkId)?.scrollIntoView({ behavior: "smooth" });
  }

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries.filter((entry) => entry.isIntersecting);
        visibleSections.sort(
          (first, second) => second.intersectionRatio - first.intersectionRatio,
        );

        const activeLink = sectionLinks.find(
          (link) => link.hash === `#${visibleSections[0]?.target.id}`,
        );
        if (activeLink) setActiveSectionLink(activeLink);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] },
    );

    sectionLinks.forEach((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) sectionObserver.observe(target);
    });
  }

  sectionLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveSectionLink(link);
      const targetId = link.getAttribute("href");
      if (!targetId) return;

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
