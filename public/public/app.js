const tg = window.Telegram?.WebApp;

const statusText = document.getElementById("status");
const consentBox = document.getElementById("consentBox");
const consentCheckbox = document.getElementById("consentCheckbox");
const verifyButton = document.getElementById("verifyButton");
const resultBox = document.getElementById("result");

if (!tg) {
  statusText.textContent =
    "Please open this page inside Telegram.";

  consentBox.classList.add("hidden");
} else {
  tg.ready();
  tg.expand();

  statusText.textContent =
    "Telegram connection detected.";

  consentBox.classList.remove("hidden");
}

consentCheckbox.addEventListener("change", () => {
  verifyButton.disabled = !consentCheckbox.checked;
});

verifyButton.addEventListener("click", async () => {
  if (!tg || !consentCheckbox.checked) {
    return;
  }

  verifyButton.disabled = true;
  verifyButton.textContent = "Verifying...";
  statusText.textContent = "Please wait...";

  const payload = {
    initData: tg.initData,

    language: navigator.language || "",

    screenWidth: window.screen.width,

    screenHeight: window.screen.height,

    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || ""
  };

  try {
    const response = await fetch("/api/verify", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Verification failed"
      );
    }

    statusText.textContent =
      "Verification completed successfully.";

    consentBox.classList.add("hidden");

    resultBox.classList.remove("hidden");

    resultBox.textContent =
      "✓ Device verification successful";

  } catch (error) {
    console.error(error);

    statusText.textContent =
      "Verification could not be completed.";

    verifyButton.disabled = false;
    verifyButton.textContent = "Try Again";
  }
});
