import { useState } from "react";

const API_URL =
  "https://ircshrmbackend.stackenzo.com/api/getattendance/last-month/excel";

// Name of the previous month, e.g. "October 2026"
function getLastMonthLabel() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// Reads the filename from the Content-Disposition header if the server sends one
function getFileName(response, fallback) {
  const header = response.headers.get("Content-Disposition");
  const match = header && header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

export default function AttendanceDownload() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");
  const monthLabel = getLastMonthLabel();

  const handleDownload = async () => {
    setStatus("loading");
    setMessage("");

    try {
      // If your API needs a login token, store it as "token" in localStorage
      const token = localStorage.getItem("token");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = getFileName(
        response,
        `attendance-${monthLabel.replace(" ", "-")}.xlsx`
      );

      // Create a temporary link and click it to start the browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatus("done");
      setMessage(`${fileName} downloaded.`);
    } catch (err) {
      setStatus("error");
      setMessage(
        err.message === "Failed to fetch"
          ? "Could not reach the server. Check your connection, or ask the backend team to allow requests from this site (CORS)."
          : `Download failed. ${err.message}`
      );
    }
  };

  return (
    <div className="ad-page">
      <style>{css}</style>

      <main className="ad-panel">
        <h1 className="ad-title">Attendance report</h1>
        <p className="ad-month">{monthLabel}</p>
        <p className="ad-text">
          Download the attendance sheet for all employees as an Excel file.
        </p>

        <button
          className="ad-button"
          onClick={handleDownload}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Preparing file…" : "Download Excel"}
        </button>

        <p
          className={`ad-status ad-status-${status}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      </main>
    </div>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;700&display=swap");

.ad-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #e9eef3;
  font-family: "Public Sans", system-ui, sans-serif;
  color: #16212c;
}
.ad-panel {
  width: 100%;
  max-width: 420px;
  padding: 36px 32px;
  background: #ffffff;
  border-left: 6px solid #0f6b4f;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(22, 33, 44, 0.12);
}
.ad-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.ad-month {
  margin: 6px 0 0;
  font-size: 2.25rem;
  font-weight: 500;
  color: #0f6b4f;
  line-height: 1.15;
}
.ad-text {
  margin: 16px 0 28px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #4a5866;
}
.ad-button {
  width: 100%;
  padding: 14px 18px;
  font: inherit;
  font-weight: 500;
  color: #ffffff;
  background: #0f6b4f;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.ad-button:hover:not(:disabled) { background: #0b5540; }
.ad-button:focus-visible { outline: 3px solid #16212c; outline-offset: 2px; }
.ad-button:disabled { background: #7d9c91; cursor: progress; }
.ad-status {
  min-height: 1.4em;
  margin: 16px 0 0;
  font-size: 0.9rem;
  line-height: 1.4;
}
.ad-status-done { color: #0f6b4f; }
.ad-status-error { color: #b3261e; }
`;
