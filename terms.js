export function showTerms(container) {
  container.innerHTML = `
    <h2>Terms and Conditions</h2>
    <p>All activities are solely based on my own interest. Terms and conditions may change without prior notice.</p>
    <h3>Terms & Conditions</h3>
    <ol>
      <li><strong>Purpose of the App</strong><br>
        This app is designed for friends or small groups to register shared expenses and follow up balances. It is only a record-keeping tool and does not handle real money transfers.
      </li>
      <li><strong>How It Works</strong>
        <ul>
          <li>Users can add expenses, assign them to group members, and view balances.</li>
          <li>Entries you add in a group may be visible to other members of that group.</li>
          <li>The app only shows calculated balances. Settlements must be handled directly between friends.</li>
        </ul>
      </li>
      <li><strong>Data & Privacy</strong>
        <ul>
          <li>We use Firebase Authentication for sign-in and cloudflare D1 database for data storage.</li>
          <li>Some requests are processed through Cloudflare Workers for speed and security.</li>
          <li>We do not sell, trade, or share your data with third parties.</li>
          <li>While we use secure platforms, no system is 100% risk-free.</li>
        </ul>
      </li>
      <li><strong>Responsibilities</strong>
        <ul>
          <li>You are responsible for the expenses and data you enter.</li>
          <li>Disagreements or settlements between friends are outside the app’s responsibility.</li>
          <li>The app is only a tool to help track; it does not verify or enforce payments.</li>
        </ul>
      </li>
      <li><strong>Limitations of Liability</strong><br>
        We are not responsible for:
        <ul>
          <li>Any financial losses, errors, or disputes between friends.</li>
          <li>Downtime, calculation errors, or delays in data updates.</li>
        </ul>
      </li>
      <li><strong>Updates</strong><br>
        We may update these Terms when needed. Continued use of the app means you accept the latest version.
      </li>
    </ol>
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
      margin-top: 15px;
    " 
    onmouseover="this.style.backgroundColor='#0056b3';" 
    onmouseout="this.style.backgroundColor='#007bff';"
    >Back to Sign Up</button>
  `;
  document.getElementById('backSignup').onclick = () => {
    window.location.hash = '#signup';
  };
}
