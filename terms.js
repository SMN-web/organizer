export function showTerms(container) {
  container.innerHTML = `
    <style>
      .terms-section {
        margin-bottom: 1.5em;
      }
      .terms-section-title {
        font-weight: bold;
        margin-bottom: 0.5em;
      }
      .terms-list {
        margin: 0.5em 0 0.5em 1.4em;
        padding: 0;
      }
      p {
        margin: 0 0 0.5em 0;
      }
      /* Make the container vertically scrollable if needed */
      :host, #termsContainer, .scrollable-terms {
        max-height: 80vh;
        overflow-y: auto;
      }
    </style>
    <h2>Terms and Conditions</h2>
    <p>All activities are solely based on my own interest. Terms and conditions may change without prior notice.</p>
    <div class="terms-section">
      <div class="terms-section-title">1. Purpose of the App</div>
      <p>This app is designed for friends or small groups to register shared expenses and follow up balances. It is only a record-keeping tool and does not handle real money transfers.</p>
    </div>
    <div class="terms-section">
      <div class="terms-section-title">2. How It Works</div>
      <ul class="terms-list">
        <li>Users can add expenses, assign them to group members, and view balances.</li>
        <li>Entries you add in a group may be visible to other members of that group.</li>
        <li>The app only shows calculated balances. Settlements must be handled directly between friends.</li>
      </ul>
    </div>
    <div class="terms-section">
      <div class="terms-section-title">3. Data & Privacy</div>
      <ul class="terms-list">
        <li>We use Firebase Authentication for sign-in and Firestore for data storage.</li>
        <li>Some requests are processed through Cloudflare Workers for speed and security.</li>
        <li>We do not sell, trade, or share your data with third parties.</li>
        <li>While we use secure platforms, no system is 100% risk-free.</li>
      </ul>
    </div>
    <div class="terms-section">
      <div class="terms-section-title">4. Responsibilities</div>
      <ul class="terms-list">
        <li>You are responsible for the expenses and data you enter.</li>
        <li>Disagreements or settlements between friends are outside the app’s responsibility.</li>
        <li>The app is only a tool to help track; it does not verify or enforce payments.</li>
      </ul>
    </div>
    <div class="terms-section">
      <div class="terms-section-title">5. Limitations of Liability</div>
      <ul class="terms-list">
        <li>Any financial losses, errors, or disputes between friends.</li>
        <li>Downtime, calculation errors, or delays in data updates.</li>
      </ul>
    </div>
    <div class="terms-section">
      <div class="terms-section-title">6. Updates</div>
      <p>We may update these Terms when needed. Continued use of the app means you accept the latest version.</p>
    </div>
    <button id="backSignup" style="
      background-color: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
      display: inline-block;
      margin-top: 10px;
    "
    onmouseover="this.style.backgroundColor='#0056b3';"
    onmouseout="this.style.backgroundColor='#007bff';"
    >Back to Sign Up</button>
  `;
  // Ensure scroll position is at the top when displayed
  container.scrollTop = 0;
  document.getElementById('backSignup').onclick = () => {
    window.location.hash = '#signup';
  };
}
