export function showCalculatorModal(parentNode, onDone) {
  const prev = parentNode.querySelector('.calculator-modal-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.className = 'calculator-modal-overlay';
  overlay.innerHTML = `
    <div class="calculator-modal animate-calculator">
      <div class="calc-header">
        <span>Calculator</span>
        <div class="calc-header-actions">
          <button class="copy-btn" title="Copy Result">📋</button>
          <button class="close-calc-btn" title="Close">&times;</button>
        </div>
      </div>
      <div class="calculator-display" id="calcDisplay">0</div>
      <div class="calc-subdisplay">
        <small id="memoryDisplay">Memory: 0</small>
      </div>
      <div class="calculator-buttons">
        <button class="calc-btn mem-btn" data-val="MC">MC</button>
        <button class="calc-btn mem-btn" data-val="MR">MR</button>
        <button class="calc-btn mem-btn" data-val="M+">M+</button>
        <button class="calc-btn mem-btn" data-val="M-">M-</button>
        <button class="calc-btn" data-val="7">7</button>
        <button class="calc-btn" data-val="8">8</button>
        <button class="calc-btn" data-val="9">9</button>
        <button class="calc-btn" data-val="/">÷</button>
        <button class="calc-btn" data-val="4">4</button>
        <button class="calc-btn" data-val="5">5</button>
        <button class="calc-btn" data-val="6">6</button>
        <button class="calc-btn" data-val="*">×</button>
        <button class="calc-btn" data-val="1">1</button>
        <button class="calc-btn" data-val="2">2</button>
        <button class="calc-btn" data-val="3">3</button>
        <button class="calc-btn" data-val="-">−</button>
        <button class="calc-btn" data-val="0">0</button>
        <button class="calc-btn" data-val=".">.</button>
        <button class="calc-btn" data-val="C">C</button>
        <button class="calc-btn" data-val="+">+</button>
        <button class="calc-btn" data-val="(">(</button>
        <button class="calc-btn" data-val=")">)</button>
        <button class="calc-btn equals-btn" id="equalsBtn">=</button>
      </div>
      <div class="history-panel">
        <div class="history-header">History</div>
        <ul id="calcHistory"></ul>
      </div>
    </div>
  `;
  parentNode.appendChild(overlay);

  let display = overlay.querySelector('#calcDisplay');
  let memoryDisplay = overlay.querySelector('#memoryDisplay');
  let historyList = overlay.querySelector('#calcHistory');
  let expr = "";
  let memory = 0;
  let history = [];

  function updateDisplay(val) {
    display.textContent = val;
    display.classList.add('anim');
    setTimeout(() => display.classList.remove('anim'), 120);
  }

  function updateMemoryDisplay() {
    memoryDisplay.textContent = `Memory: ${memory}`;
  }

  function addToHistory(expression, result) {
    history.unshift({ expression, result });
    if (history.length > 5) history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = "";
    history.forEach((h, i) => {
      const li = document.createElement('li');
      li.textContent = `${h.expression} = ${h.result}`;
      li.onclick = () => {
        expr = h.result.toString();
        updateDisplay(expr);
      };
      historyList.appendChild(li);
    });
  }

  function evaluateExpression() {
    try {
      if (!expr) return;
      const oBrackets = (expr.match(/\(/g) || []).length;
      const cBrackets = (expr.match(/\)/g) || []).length;
      if (oBrackets !== cBrackets) {
        updateDisplay("Error: Bracket mismatch");
        return;
      }
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result === "number" && isFinite(result)) {
        const formatted = Number.isInteger(result)
          ? result.toString()
          : result.toFixed(8).replace(/\.?0+$/, "");
        addToHistory(expr, formatted);
        expr = result.toString();
        updateDisplay(formatted);
        if (onDone) onDone(result);
      } else {
        updateDisplay("Error");
      }
    } catch {
      updateDisplay("Error");
    }
  }

  overlay.querySelectorAll('.calc-btn').forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.val;

      // Memory functions
      if (["MC", "MR", "M+", "M-"].includes(v)) {
        if (v === "MC") memory = 0;
        if (v === "MR") {
          expr += memory.toString();
          updateDisplay(expr);
        }
        if (v === "M+") memory += parseFloat(display.textContent) || 0;
        if (v === "M-") memory -= parseFloat(display.textContent) || 0;
        updateMemoryDisplay();
        return;
      }

      if (v === "C") {
        expr = "";
        updateDisplay("0");
        return;
      }

      if (btn.classList.contains('equals-btn')) {
        evaluateExpression();
        return;
      }

      // Prevent invalid starts
      if (expr === "" && /^[+*/.]$/.test(v)) return;

      // Prevent duplicate operators
      if (/[+\-*/.]$/.test(expr) && /[+\-*/.]/.test(v)) {
        expr = expr.slice(0, -1) + v;
      } else {
        // Only one dot per number segment
        if (v === ".") {
          const segments = expr.split(/[\+\-\*\/]/);
          const last = segments[segments.length - 1];
          if (last.includes(".")) return;
        }
        if (v === ")") {
          const oBrackets = (expr.match(/\(/g) || []).length;
          const cBrackets = (expr.match(/\)/g) || []).length;
          if (oBrackets <= cBrackets) return;
        }
        expr += v;
      }
      updateDisplay(expr.replace(/\//g, "÷").replace(/\*/g, "×"));
    };
  });

  // Copy button
  overlay.querySelector('.copy-btn').onclick = () => {
    navigator.clipboard.writeText(display.textContent).then(() => {
      updateDisplay("Copied!");
      setTimeout(() => updateDisplay(expr || "0"), 600);
    });
  };

  // Close
  overlay.querySelector('.close-calc-btn').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  // Keyboard support
  document.addEventListener('keydown', keyHandler);
  function keyHandler(e) {
    if (!overlay.isConnected) {
      document.removeEventListener('keydown', keyHandler);
      return;
    }
    if (/[0-9+\-*/().]/.test(e.key)) {
      expr += e.key;
      updateDisplay(expr.replace(/\//g, "÷").replace(/\*/g, "×"));
    } else if (e.key === "Enter") {
      e.preventDefault();
      evaluateExpression();
    } else if (e.key === "Backspace") {
      expr = expr.slice(0, -1);
      updateDisplay(expr || "0");
    } else if (e.key === "Escape") {
      expr = "";
      updateDisplay("0");
    }
  }

  setTimeout(() => {
    overlay.querySelector('.calculator-modal').classList.remove('animate-calculator');
  }, 400);
}