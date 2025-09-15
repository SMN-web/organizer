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
        <button class="calc-btn clear-btn" data-val="C">C</button>
        <button class="calc-btn" data-val="+">+</button>
      </div>
      <button class="calc-btn equals-btn" id="equalsBtn">=</button>
    </div>
  `;
  parentNode.appendChild(overlay);

  let display = overlay.querySelector('#calcDisplay');
  let expr = "";

  function updateDisplay(val) {
    display.textContent = val;
    display.classList.add('anim');
    setTimeout(() => display.classList.remove('anim'), 120);
  }

  function endsWithOperator(s) {
    return /[+\-*/.]$/.test(s);
  }

  overlay.querySelectorAll('.calc-btn').forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.val;

      if (v === "C") {
        expr = "";
        updateDisplay("0");
      } else if (btn.classList.contains('equals-btn')) {
        try {
          if (expr === "") {
            updateDisplay("0");
            return;
          }
          if (endsWithOperator(expr)) {
            updateDisplay("Error");
            expr = "";
            return;
          }
          // Evaluate only JS friendly operators
          let res = eval(expr);
          expr = "";
          if (typeof res === "number" && isFinite(res)) {
            const displayVal = Number.isInteger(res) ? res.toString() : res.toFixed(8).replace(/\.?0+$/, "");
            updateDisplay(displayVal);
            if (onDone && !isNaN(res)) onDone(res);
          } else {
            updateDisplay("Error");
          }
        } catch {
          updateDisplay("Error");
          expr = "";
        }
      } else {
        if (expr === "" && /^[+*/.]$/.test(v)) return;

        if (endsWithOperator(expr) && /[+\-*/.]/.test(v)) {
          expr = expr.slice(0, -1) + v;
        } else {
          if (v === ".") {
            let segments = expr.split(/[\+\-\*\/]/);
            let lastSegment = segments[segments.length - 1];
            if (lastSegment.includes(".")) return;
          }
          expr += v;
        }
        updateDisplay(expr
          // Show pretty operator in display (optional)
          .replace(/\//g, "÷")
          .replace(/\*/g, "×")
        );
      }
    };
  });

  overlay.querySelector('.close-calc-btn').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  setTimeout(() => {
    overlay.querySelector('.calculator-modal').classList.remove('animate-calculator');
  }, 400);
}
