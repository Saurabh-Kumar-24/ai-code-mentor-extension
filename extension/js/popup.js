// ─────────────────────────────────────────────────────
// CONFIG — change this to your deployed URL after deploy
// ─────────────────────────────────────────────────────
//const API_BASE = "http://localhost:5000";
const API_BASE = "https://ai-code-mentor-extension.onrender.com";
const resultDiv  = document.getElementById("result");
const codeInput  = document.getElementById("code");
const analyzeBtn = document.getElementById("analyzeBtn");
const approachBtn= document.getElementById("approachBtn");
const copyBtn    = document.getElementById("copyBtn");
const clearBtn   = document.getElementById("clearBtn");

// ─────────────────────────────────────────────────────
// Render Gemini bullet-point response into styled HTML
// ─────────────────────────────────────────────────────
function renderMarkdown(text) {
  text = text.replace(/\$([^$]+)\$/g, "$1");
  const lines = text.split("\n");
  let html = "";

  lines.forEach(line => {
    const trimmed = line.trim();

    if (!trimmed) {
      html += "<br/>";
      return;
    }

    // **Section Title:**
    if (/^\*\*(.+)\*\*:?$/.test(trimmed)) {
      const title = trimmed.replace(/\*\*/g, "").replace(/:$/, "");
      html += `<div class="section-title">${escHtml(title)}</div>`;
      return;
    }

    // Bullet point: • or - or *
    if (/^[•\-\*]/.test(trimmed)) {
      const content = trimmed.replace(/^[•\-\*]\s*/, "");
      let cls = "bullet";
      if (/error|wrong|issue|incorrect|bug/i.test(content)) cls += " error";
      else if (/hint|optim|use |try |consider|instead/i.test(content)) cls += " hint";
      else if (/O\(|complexity/i.test(content)) cls += " complexity";
      html += `<div class="${cls}">• ${escHtml(content)}</div>`;
      return;
    }

    // Plain line
    html += `<div class="bullet">${escHtml(trimmed)}</div>`;
  });

  return html;
}

function escHtml(t) {
  return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function showLoading(msg) {
  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = `
    <div class="loading">
      <div class="dots"><span></span><span></span><span></span></div>
      <span>${msg}</span>
    </div>`;
}

function showResult(text) {
  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = renderMarkdown(text);
}

function showError(msg) {
  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = `<div class="bullet error">❌ ${escHtml(msg)}</div>`;
}

function setBtnsDisabled(val) {
  analyzeBtn.disabled = val;
  approachBtn.disabled = val;
}

// ─────────────────────────────────────────────────────
// 🟡 Grab Selected Text from page
// ─────────────────────────────────────────────────────
document.getElementById("getSelection").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "GET_SELECTED_CODE" }, (response) => {
      if (chrome.runtime.lastError) {
        showError("Could not connect to page. Try refreshing.");
        return;
      }
      if (response && response.code && response.code.trim() !== "") {
        codeInput.value = response.code;
        resultDiv.classList.add("hidden");
      } else {
        showError("No text selected on page.");
      }
    });
  });
});

// ─────────────────────────────────────────────────────
// 🟢 Analyze Code
// ─────────────────────────────────────────────────────
analyzeBtn.addEventListener("click", async () => {
  const code = codeInput.value.trim();
  if (!code) { showError("Please paste some code first."); return; }

  setBtnsDisabled(true);
  showLoading("Analyzing your code...");

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    data.analysis ? showResult(data.analysis) : showError("No response from AI.");
  } catch {
    showError("Cannot connect to backend. Is the server running?");
  } finally {
    setBtnsDisabled(false);
  }
});

// ─────────────────────────────────────────────────────
// 🔵 Get Approach
// ─────────────────────────────────────────────────────
approachBtn.addEventListener("click", async () => {
  const question = codeInput.value.trim();
  if (!question) { showError("Please paste a problem statement first."); return; }

  setBtnsDisabled(true);
  showLoading("Generating approach...");

  try {
    const res = await fetch(`${API_BASE}/approach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    data.analysis ? showResult(data.analysis) : showError("No response from AI.");
  } catch {
    showError("Cannot connect to backend. Is the server running?");
  } finally {
    setBtnsDisabled(false);
  }
});

// ─────────────────────────────────────────────────────
// ⎘ Copy  /  ✕ Clear
// ─────────────────────────────────────────────────────
copyBtn.addEventListener("click", () => {
  const text = resultDiv.innerText;
  if (!text || resultDiv.classList.contains("hidden")) return;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => { copyBtn.textContent = "⎘ Copy"; }, 2000);
  });
});

clearBtn.addEventListener("click", () => {
  codeInput.value = "";
  resultDiv.innerHTML = "";
  resultDiv.classList.add("hidden");
});
