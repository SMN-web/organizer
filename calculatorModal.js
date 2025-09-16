export function showCalculatorModal(parentNode, onDone) {
  const prev = parentNode.querySelector('.calculator-modal-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.className = 'calculator-modal-overlay';
  overlay.innerHTML = `
    <div class="calculator-modal animate-calculator">
      <div class="calc-header">
        <span>Calculator</span>
        <button class="close-calc-btn" title="Close">&times;</button>
      </div>

      <div class="calculator-display" id="calcDisplay">0</div>

      <div class="calculator-buttons">
        <button data-val="7">7</button>
        <button data-val="8">8</button>
        <button data-val="9">9</button>
        <button data-val="/">÷</button>

        <button data-val="4">4</button>
        <button data-val="5">5</button>
        <button data-val="6">6</button>
        <button data-val="*">×</button>

        <button data-val="1">1</button>
        <button data-val="2">2</button>
        <button data-val="3">3</button>
        <button data-val="-">−</button>

        <button data-val="0">0</button>
        <button data-val=".">.</button>
        <button data-val="C">C</button>
        <button data-val="+">+</button>

        <button data-val="(">(</button>
        <button data-val=")">)</button>
        <button class="equals-btn">=</button>
      </div>

      <div class="history-header">
        <span>History</span>
        <button class="clear-history-btn">Clear</button>
      </div>
      <div class="calc-history" id="calcHistory"></div>
    </div>
  `;
  parentNode.appendChild(overlay);

  const display = overlay.querySelector('#calcDisplay');
  const historyContainer = overlay.querySelector('#calcHistory');
  let expr = "";

  // ---- Load history from localStorage ----
  function loadHistory() {
    let stored = JSON.parse(localStorage.getItem("calcHistory") || "[]");
    renderHistory(stored);
  }

  function saveHistory(entry) {
    let stored = JSON.parse(localStorage.getItem("calcHistory") || "[]");
    stored.unshift(entry);
    if (stored.length > 20) stored.pop(); // keep only 20 items
    localStorage.setItem("calcHistory", JSON.stringify(stored));
    renderHistory(stored);
  }

  function clearHistory() {
    localStorage.removeItem("calcHistory");
    renderHistory([]);
  }

  function renderHistory(items) {
    historyContainer.innerHTML = "";
    if (items.length === 0) {
      historyContainer.innerHTML = `<div class="empty-history">No history</div>`;
      return;
    }
    items.forEach(item => {
      const el = document.createElement("div");
      el.className = "history-item";
      el.innerHTML = `<span class="expr">${item.expr}</span> = <span class="res">${item.res}</span>`;
      el.onclick = () => {
        expr = item.res.toString();
        updateDisplay(expr);
      };
      historyContainer.appendChild(el);
    });
  }

  function updateDisplay(val) {
    display.textContent = val;
    display.classList.add('anim');
    setTimeout(() => display.classList.remove('anim'), 120);
  }

  function safeEval(expression) {
    try {
      // Only allow digits, operators, brackets, and decimals
      if (!/^[0-9+\-*/().\s]+$/.test(expression)) return "Err";
      let result = Function('"use strict";return (' + expression + ")")();
      if (typeof result === "number" && isFinite(result)) {
        return Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, "");
      }
      return "Err";
    } catch {
      return "Err";
    }
  }

  // ---- Button Handling ----
  overlay.querySelectorAll('.calculator-buttons button').forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.val;
      if (!v) {
        if (btn.classList.contains('equals-btn')) {
          if (!expr) return;
          let result = safeEval(expr);
          updateDisplay(result);
          if (result !== "Err") {
            saveHistory({ expr, res: result });
            if (onDone) onDone(parseFloat(result));
          }
          expr = result === "Err" ? "" : result;
        }
        return;
      }

      if (v === "C") {
        expr = "";
        updateDisplay("0");
      } else {
        expr += v;
        updateDisplay(expr.replace(/\//g, "÷").replace(/\*/g, "×"));
      }
    };
  });

  // ---- Keyboard Support ----
  window.addEventListener("keydown", handleKey);
  function handleKey(e) {
    if (!document.body.contains(overlay)) {
      window.removeEventListener("keydown", handleKey);
      return;
    }
    if (/[0-9+\-*/().]/.test(e.key)) {
      expr += e.key;
      updateDisplay(expr.replace(/\//g, "÷").replace(/\*/g, "×"));
    } else if (e.key === "Enter") {
      let result = safeEval(expr);
      updateDisplay(result);
      if (result !== "Err") {
        saveHistory({ expr, res: result });
        if (onDone) onDone(parseFloat(result));
      }
      expr = result === "Err" ? "" : result;
    } else if (e.key === "Backspace") {
      expr = expr.slice(0, -1);
      updateDisplay(expr || "0");
    } else if (e.key.toLowerCase() === "c") {
      expr = "";
      updateDisplay("0");
    } else if (e.key === "Escape") {
      overlay.remove();
    }
  }

  // ---- Close & Clear History ----
  overlay.querySelector('.close-calc-btn').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.clear-history-btn').onclick = clearHistory;

  // ---- Initial load ----
  loadHistory();

  setTimeout(() => {
    overlay.querySelector('.calculator-modal').classList.remove('animate-calculator');
  }, 400);
}