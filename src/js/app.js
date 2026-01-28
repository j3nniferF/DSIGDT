/* =====================================================
   HP Tabs Behavior (MVP)
   Purpose:
   - Allow switching between task tabs
   - Enforce ONE active tab at a time
   - No task filtering yet (visual state only)

   IMPORTANT:
   - Do NOT rename .tab or .tab--active without updating CSS
   - Do NOT add task logic here yet
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active state from all tabs
      tabs.forEach((t) => {
        t.classList.remove("tab--active");
        t.removeAttribute("aria-current");
      });

      // Activate the clicked tab
      tab.classList.add("tab--active");
      tab.setAttribute("aria-current", "page");

      // Future hook:
      // const selectedTab = tab.dataset.tab;
      // We will use this later to filter tasks.
    });
  });
});