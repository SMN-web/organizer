import { sendHeartbeat } from './heartbeat.js'; // Your heartbeat function

export function showAdminPanel(container, auth) {
  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = '<div style="color:#b71c1c;margin:2em 0;font-weight:bold;">Not logged in. Please log in first.</div>';
    return;
  }

  container.innerHTML = `
    <h2>User Admin Panel</h2>
    <div style="display:flex;align-items:center;gap:2em;flex-wrap:wrap;">
      <div>
        <label>Role: <select id="filterRole">
          <option value="">All</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select></label>
        <label>Email: <input type="text" id="filterEmail" placeholder="Email filter"></label>
        <label>Name: <input type="text" id="filterName" placeholder="Name filter"></label>
      </div>
      <div>
        <span style="font-weight:bold;">Pending approvals:</span>
        <span id="pendingBadge" style="background:#e74c3c;color:white;border-radius:1em;padding:0.3em 0.8em;">0</span>
      </div>
    </div>
    <h3 style="margin-top:1.2em;">All Users</h3>
    <div style="overflow-x:auto;">
      <table id="usersTable" border="1" style="width:100%;min-width:600px;">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Username</th><th>Role</th><th>Status</th><th>Created At</th><th>Change Role</th><th>Delete</th>
          </tr>
        </thead>
        <tbody id="usersRows"></tbody>
      </table>
    </div>
    <h3 style="margin-top:1.2em;">Pending User Approvals</h3>
    <div id="pendingApprovalSection"></div>
    <div id="adminPanelMsg" style="color:#e74c3c;margin-top:1em;"></div>
  `;

  async function getFreshToken() {
    if (!auth.currentUser) throw new Error("Not logged in");
    return await auth.currentUser.getIdToken(true);
  }

  function showErrorPage(msg) {
    container.innerHTML = `
      <div style="margin:4em auto;max-width:450px;text-align:center;">
        <h2>Access Error</h2>
        <div style="color:#b71c1c">${msg}</div>
        <button onclick="window.firebaseAuth.signOut()">Logout</button>
      </div>
    `;
  }

  async function fetchUsersAndRender() {
    let token;
    try { token = await getFreshToken(); } catch (e) { showErrorPage("Not logged in."); return; }
    sendHeartbeat(token);
    const role = document.getElementById('filterRole').value;
    const email = document.getElementById('filterEmail').value.trim();
    const name = document.getElementById('filterName').value.trim();
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (email) params.append('email', email);
    if (name) params.append('name', name);

    try {
      const res = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/users?' + params.toString(), {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) {
        let msg = "";
        try {
          const { error, detail } = await res.json();
          msg = `<p><b>${error || "Unknown error"}</b></p><p>${detail || ""}</p>`;
        } catch {
          msg = "<b>Unexpected backend error</b>";
        }
        showErrorPage(msg);
        return;
      }
      const { users, pendingCount } = await res.json();
      document.getElementById('pendingBadge').textContent = pendingCount || 0;
      const tbody = document.getElementById('usersRows');
      tbody.innerHTML = users.map(u => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.username}</td>
          <td>${u.role}</td>
          <td>${u.adminApproval}</td>
          <td>${new Date(u.createdAt).toLocaleString()}</td>
          <td>
            <select data-username="${u.username}" class="roleSelect"
              ${u.adminApproval !== "approved" || u.role==="admin" ? "disabled" : ""}>
              <option value="user" ${u.role==="user"?"selected":""}>User</option>
              <option value="admin" ${u.role==="admin"?"selected":""}>Admin</option>
              <option value="moderator" ${u.role==="moderator"?"selected":""}>Moderator</option>
            </select>
          </td>
          <td>
            <button data-username="${u.username}" class="deleteBtn"
                style="color:white;background:#e74c3c;border:none;"
                ${u.role==="admin" ? "disabled title='Admin cannot be deleted'" : ""}>
              Delete
            </button>
          </td>
        </tr>
      `).join('');
      [...container.querySelectorAll('.roleSelect')].forEach(sel => {
        sel.onchange = async e => {
          let token; try { token = await getFreshToken(); } catch (e) { showErrorPage("Not logged in."); return; }
          const username = e.target.getAttribute('data-username');
          const newRole = e.target.value;
          const res = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/change-role', {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ username, newRole })
          });
          const json = await res.json();
          document.getElementById('adminPanelMsg').textContent =
            res.ok ? "Role updated." : (json.error || "") + (json.detail ? " | " + json.detail : "");
          fetchUsersAndRender();
        };
      });
      [...container.querySelectorAll('.deleteBtn')].forEach(btn => {
        btn.onclick = async () => {
          if (btn.disabled) return;
          let token; try { token = await getFreshToken(); } catch (e) { showErrorPage("Not logged in."); return; }
          if (confirm("Delete user from DB and Firebase Auth? This cannot be undone.")) {
            const username = btn.getAttribute('data-username');
            document.getElementById("adminPanelMsg").textContent = "Deleting...";
            const res = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/delete', {
              method: "POST",
              headers: { "Content-Type":"application/json", "Authorization": "Bearer " + token },
              body: JSON.stringify({ username })
            });
            const json = await res.json();
            document.getElementById("adminPanelMsg").textContent =
              res.ok ? "User deleted successfully." : (json.error || "") + (json.detail ? " | " + json.detail : "");
            fetchUsersAndRender();
          }
        };
      });
      // Pending approvals
      const pendingUsers = users.filter(u => u.adminApproval === "pending");
      document.getElementById('pendingApprovalSection').innerHTML = pendingUsers.length
        ? pendingUsers.map(u => `
            <div style="border:1px solid #ccc;padding:1em;margin-bottom:0.7em;">
              <b>${u.name}</b> (${u.email}, Username: ${u.username}), Created: ${new Date(u.createdAt).toLocaleString()}<br>
              Role: ${u.role}
              <button class="approveBtn" data-username="${u.username}">Approve</button>
              <button class="rejectBtn" data-username="${u.username}">Reject</button>
            </div>
          `).join('')
        : "<p>No pending users.</p>";
      [...container.querySelectorAll('.approveBtn')].forEach(btn => {
        btn.onclick = async () => {
          let token; try { token = await getFreshToken(); } catch (e) { showErrorPage("Not logged in."); return; }
          const username = btn.getAttribute('data-username');
          const res = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/approve', {
            method:"POST",
            headers:{"Content-Type":"application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({username})
          });
          fetchUsersAndRender();
        };
      });
      [...container.querySelectorAll('.rejectBtn')].forEach(btn => {
        btn.onclick = async () => {
          let token; try { token = await getFreshToken(); } catch (e) { showErrorPage("Not logged in."); return; }
          if (confirm("Reject user and delete from both DB and Firebase Auth?")) {
            const username = btn.getAttribute('data-username');
            document.getElementById("adminPanelMsg").textContent = "Deleting...";
            const res = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/delete', {
              method:"POST",
              headers:{"Content-Type":"application/json", "Authorization": "Bearer " + token },
              body: JSON.stringify({username})
            });
            fetchUsersAndRender();
          }
        };
      });
    } catch(e) {
      container.innerHTML = `<div style="color:#b71c1c">UI/frontend error: ${e && e.message ? e.message : e}</div>`;
    }
  }

  ['filterRole', 'filterEmail', 'filterName'].forEach(id => {
    container.querySelector('#' + id).oninput = fetchUsersAndRender;
    container.querySelector('#' + id).onchange = fetchUsersAndRender;
  });
  fetchUsersAndRender();
}
