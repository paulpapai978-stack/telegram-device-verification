const table = document.getElementById("verificationTable");
const status = document.getElementById("status");
const refreshButton = document.getElementById("refreshButton");

async function loadVerifications() {
  status.textContent = "Loading...";
  table.innerHTML = "";

  try {
    const response = await fetch("/api/admin/verifications");

    if (!response.ok) {
      throw new Error("Unable to load verification data");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Unable to load data");
    }

    for (const item of data.verifications) {
      const row = document.createElement("tr");

      const values = [
        item.id,
        item.telegram_id,
        item.username || "-",
        item.ip || "-",
        item.user_agent || "-",
        item.language || "-",
        `${item.screen_width} × ${item.screen_height}`,
        item.timezone || "-",
        item.created_at
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      }

      table.appendChild(row);
    }

    status.textContent =
      `${data.verifications.length} verification(s) found.`;

  } catch (error) {
    console.error(error);
    status.textContent = error.message;
  }
}

refreshButton.addEventListener("click", loadVerifications);

loadVerifications();
