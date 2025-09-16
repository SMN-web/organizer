export function showCalculatorModal(parentNode, onDone) {
  // remove old modal if exists
  const prev = parentNode.querySelector('.calculator-modal-overlay');
  if (prev) prev.remove();

  // build overlay + modal
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
        ${[7,8,9,"/",4,5,6,"*",1,2,3,"-",0,".","C","+", "(",")"]
          .map(val => {
            let text = val;
            if (val === "/") text = "÷";
            if (val === "*") text = "×";
            if (val === "-") text = "−";
            return `<button class="calc-btn" data-val="${val}">${text}</button>`;
          }).join("")}
      </div>
      <button class="calc-btn equals-btn" id="equalsBtn">=</button>
    </div>
  `;
  parentNode.appendChild(overlay);

  // elements
  const display = overlay.querySelector('#calcDisplay');
  const closeBtn = overlay.querySelector('.close-calc-btn');

  // state
  let expression = "";      // raw safe expression
  let lastExpression = "";  // for repeated =
  
  // helpers
  const formatForDisplay = s => s.replace(/\//g,"÷").replace(/\*/g,"×");
  const endsWithOperator = s => /[+\-*/.]$/.test(s);
  const updateDisplay = val => {
    display.textContent = val;
    display.classList.add('anim');
    setTimeout(()=> display.classList.remove('anim'),120);
  };

  // handle calculation safely
  function calculate() {
    if (!expression) return "0";
    try {
      // bracket validation
      const oB = (expression.match(/\(/g)||[]).length;
      const cB = (expression.match(/\)/g)||[]).length;
      if (oB !== cB) return "Bracket mismatch";

      if (endsWithOperator(expression)) return "Invalid end";

      // safe eval using Function constructor
      const res = Function("return " + expression)();
      if (typeof res !== "number" || !isFinite(res)) return "Error";

      // keep expression for chaining
      lastExpression = expression;
      expression = res.toString();

      // format decimals
      return Number.isInteger(res) ? res.toString() : res.toFixed(8).replace(/\.?0+$/,"");
    } catch {
      return "Error";
    }
  }

  // handle button clicks
  overlay.querySelectorAll('.calc-btn').forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.val;

      if (v === "C") {
        expression = "";
        lastExpression = "";
        updateDisplay("0");
        return;
      }

      if (btn.classList.contains("equals-btn")) {
        if (!expression && lastExpression) expression = lastExpression;
        const result = calculate();
        updateDisplay(formatForDisplay(result));
        if (!isNaN(result) && onDone) onDone(Number(result));
        return;
      }

      // rules for building expression
      if (expression === "" && /^[+*/.]$/.test(v)) return;
      if (endsWithOperator(expression) && /[+\-*/.]/.test(v)) {
        expression = expression.slice(0,-1) + v;
      } else {
        if (v === ".") {
          const parts = expression.split(/[\+\-\*\/]/);
          if (parts[parts.length-1].includes(".")) return;
        }
        if (v === ")") {
          const oB = (expression.match(/\(/g)||[]).length;
          const cB = (expression.match(/\)/g)||[]).length;
          if (oB <= cB) return;
        }
        expression += v;
      }

      updateDisplay(formatForDisplay(expression));
    };
  });

  // closing
  closeBtn.onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  setTimeout(()=> overlay.querySelector('.calculator-modal').classList.remove('animate-calculator'),400);
}