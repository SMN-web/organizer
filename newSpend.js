export function showNewSpend(container) {
  container.innerHTML = `
    <form class="entry-form">
      <label>
        Friends Sharing:
        <div class="friend-chips"></div>
      </label>
      <label>
        Paid By:
        <select class="paid-by-select"></select>
      </label>
      <label>
        Amount Paid (QAR):<br>
        <input type="number" min="0.01" step="0.01" class="amount-input" required>
      </label>
      <div class="split-ui"></div>
      <button type="submit" class="primary-btn">Distribute & Save</button>
    </form>
  `;
  // TODO: friend selection, share splitting, lock/unlock, and save logic.
}
