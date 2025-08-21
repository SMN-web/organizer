// Simple test panel to display current Firebase ID token and debug errors

// Replace '#main' with your container as needed
const main = document.getElementById('main') || document.body;

// Function to get and show current user token
async function showCurrentToken() {
  let content = `<h2>Firebase Auth Token Debug</h2>`;
  try {
    if (!firebase.auth().currentUser) {
      content += `<div style="color:red;">Not logged in. Please sign in first.</div>`;
    } else {
      const token = await firebase.auth().currentUser.getIdToken(true);
      content += `<div><b>Your ID Token:</b></div>
      <textarea style="width:98%;height:8em;" readonly>${token}</textarea>
      <div style="font-size:smaller">Token length: ${token.length} characters</div>`;
    }
  } catch (e) {
    content += `<div style="color:red;">Error fetching token: ${e.message || e.toString()}</div>`;
  }
  main.innerHTML = content;
}

// Render on page load
showCurrentToken();
