document.addEventListener("DOMContentLoaded", function () {
  const exportBtn = document.getElementById("exportBtn");
  const statusDiv = document.getElementById("status");

  exportBtn.addEventListener("click", function () {
    // Get the selected scope
    const scope = document.querySelector('input[name="scope"]:checked').value;

    if (scope === "currentTab") {
      // Get cookies from current tab only
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        const url = new URL(activeTab.url);

        chrome.cookies.getAll({ domain: url.hostname }, function (cookies) {
          processCookies(cookies, url.hostname);
        });
      });
    } else {
      // Get all cookies
      chrome.cookies.getAll({}, function (cookies) {
        processCookies(cookies, "all-domains");
      });
    }
  });

  function processCookies(cookies, domain) {
    const formattedCookies = cookies.map((cookie) => {
      // Calculate expiration date in UNIX timestamp format
      let expirationDate =
        cookie.expirationDate || Math.floor(Date.now() / 1000) + 31536000; // 1 year from now

      return {
        domain: cookie.domain,
        path: cookie.path,
        name: cookie.name,
        value: cookie.value,
        expirationDate: expirationDate,
        hostOnly: !cookie.domain.startsWith("."),
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        session: !cookie.expirationDate,
        sameSite: cookie.sameSite || "Lax",
      };
    });

    // Prepare the JSON content
    const jsonContent = JSON.stringify(formattedCookies, null, 2);

    // Create a blob and download
    const blob = new Blob([jsonContent], { type: "application/json" });
    const filename = `cookies-${domain}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    chrome.downloads.download(
      {
        url: URL.createObjectURL(blob),
        filename: filename,
        saveAs: true,
      },
      function () {
        statusDiv.textContent = `Exported ${formattedCookies.length} cookies successfully!`;
        setTimeout(() => {
          statusDiv.textContent = "";
        }, 3000);
      }
    );
  }
});
