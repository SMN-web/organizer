export function showCalculatorModal(parentNode, onDone) {
  // Remove existing modal if present
  const prev = parentNode.querySelector('.calculator-modal-overlay');
  if (prev) prev.remove();

  // Build modal and overlay
  const overlay = document.createElement('div');
  overlay.className = 'calculator-modal-overlay';

  overlay.innerHTML = `
    <div class="calculator-modal animate-calculator">
      <div class="calc-header">
        <span>Calculator</span>
        <button class="close-calc-btn" title="Close">&times;</button>
      </div>
      <input type="text" class="calculator-input" placeholder="0" autofocus />
      <div class="calculator-buttons">
        <button class="calc-btn" data-val="1">1</button>
        <button class="calc-btn" data-val="2">2</button>
        <button class="calc-btn" data-val="3">3</button>
        <button class="calc-btn" data-val="+">+</button>
        <button class="calc-btn" data-val="4">4</button>
        <button class="calc-btn" data-val="5">5</button>
        <button class="calc-btn" data-val="6">6</button>
        <button class="calc-btn" data-val="-">-</button>
        <button class="calc-btn" data-val="7">7</button>
        <button class="calc-btn" data-val="8">8</button>
        <button class="calc-btn" data-val="9">9</button>
        <button class="calc-btn" data-val="*">*</button>
        <button class="calc-btn" data-val="0">0</button>
        <button class="calc-btn" data-val=".">.</button>
        <button class="calc-btn" data-val="/">/</button>
        <button class="calc-btn" data-val="(">(</button>
        <button class="calc-btn" data-val=")">)</button>
        <button class="calc-btn clear-btn" title="Clear">C</button>
      </div>
      <button class="calculator-equals">=</button>
    </div>
  `;
  parentNode.appendChild(overlay);

  // Input and events
  const input = overlay.querySelector('.calculator-input');

  overlay.querySelectorAll('.calc-btn').forEach(btn => {
    btn.onclick = () => {
      if (btn.classList.contains('clear-btn')) {
        input.value = "";
      } else {
        input.value += btn.dataset.val;
      }
      input.focus();
    };
  });

  // Calculate on equals
  overlay.querySelector('.calculator-equals').onclick = () => {
    try {
      let res = eval(input.value);
      if (typeof res === 'number' && !isNaN(res)) {
        input.value = parseFloat(res).toFixed(2);
        if (onDone) onDone(parseFloat(input.value));
      } else {
        input.value = "Error";
      }
    } catch { input.value = "Error"; }
    input.focus();
  };

  // Close actions
  overlay.querySelector('.close-calc-btn').onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  setTimeout(() => {
    overlay.querySelector('.calculator-modal').classList.remove('animate-calculator');
  }, 400);

  input.focus();
}
