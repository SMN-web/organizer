export function showAdminPanel(container) {
  container.innerHTML = `
    <h2>User Admin Panel</h2>
    <div style="display:flex;align-items:center;gap:2em;">
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
      <table id="usersTable" border="1" style="width:100%;min-width:500px;">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Change Role</th><th>Delete</th>
          </tr>
        </thead>
        <tbody id="usersRows"></tbody>
      </table>
    </div>
    <h3 style="margin-top:1.2em;">Pending User Approvals</h3>
    <div id="pendingApprovalSection"></div>
    <div id="adminPanelMsg" style="color:#e74c3c;margin-top:1em;"></div>
  `;

  async function fetchUsersAndRender() {
    const role = document.getElementById('filterRole').value;
    const email = document.getElementById('filterEmail').value.trim();
    const name = document.getElementById('filterName').value.trim();
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (email) params.append('email', email);
    if (name) params.append('name', name);

    const res = await fetch('/api/users?' + params.toString());
    const { users, pendingCount } = await res.json();

    document.getElementById('pendingBadge').textContent = pendingCount || 0;
    const tbody = document.getElementById('usersRows');
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.adminApproval}</td>
        <td>
          <select data-userid="${u.userId}" class="roleSelect" ${u.adminApproval !== "approved" ? "disabled" : ""}>
            <option value="user" ${u.role==="user"?"selected":""}>User</option>
            <option value="admin" ${u.role==="admin"?"selected":""}>Admin</option>
            <option value="moderator" ${u.role==="moderator"?"selected":""}>Moderator</option>
          </select>
        </td>
        <td>
          <button data-userid="${u.userId}" data-uid="${u.userId}" class="deleteBtn" style="color:white;background:#e74c3c;border:none;">Delete</button>
        </td>
      </tr>
    `).join('');

    [...container.querySelectorAll('.roleSelect')].forEach(sel => {
      sel.onchange = async e => {
        const userId = e.target.getAttribute('data-userid');
        const newRole = e.target.value;
        await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/change-role', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, newRole })
        });
        fetchUsersAndRender();
      };
    });

    [...container.querySelectorAll('.deleteBtn')].forEach(btn => {
      btn.onclick = async () => {
        if (confirm("Delete user from DB and Firebase Auth? This cannot be undone.")) {
          const userId = btn.getAttribute('data-userid');
          document.getElementById("adminPanelMsg").textContent = "Deleting...";
          const res = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/delete', {
            method: "POST",
            headers: { "Content-Type":"application/json" },
            body: JSON.stringify({ userId })
          });
          const json = await res.json();
          if (res.ok) {
            document.getElementById("adminPanelMsg").textContent = "User deleted successfully.";
          } else {
            document.getElementById("adminPanelMsg").textContent = json.error || "Failed to delete.";
          }
          fetchUsersAndRender();
        }
      };
    });

    // Render pending approval section
    const pendingUsers = users.filter(u => u.adminApproval === "pending");
    document.getElementById('pendingApprovalSection').innerHTML = pendingUsers.length
      ? pendingUsers.map(u => `
          <div style="border:1px solid #ccc;padding:1em;margin-bottom:0.7em;">
            <b>${u.name}</b> (${u.email})<br>
            Role: ${u.role}
            <button class="approveBtn" data-userid="${u.userId}">Approve</button>
            <button class="rejectBtn" data-userid="${u.userId}">Reject</button>
          </div>
        `).join('')
      : "<p>No pending users.</p>";

    [...container.querySelectorAll('.approveBtn')].forEach(btn => {
      btn.onclick = async () => {
        const userId = btn.getAttribute('data-userid');
        await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/approve', {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({userId})
        });
        fetchUsersAndRender();
      };
    });

    [...container.querySelectorAll('.rejectBtn')].forEach(btn => {
      btn.onclick = async () => {
        if (confirm("Reject user and delete from both DB and Firebase Auth?")) {
          const userId = btn.getAttribute('data-userid');
          document.getElementById("adminPanelMsg").textContent = "Deleting...";
          const res = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/user/delete', {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({userId})
          });
          const json = await res.json();
          if (res.ok) {
            document.getElementById("adminPanelMsg").textContent = "User deleted successfully.";
          } else {
            document.getElementById("adminPanelMsg").textContent = json.error || "Failed to delete.";
          }
          fetchUsersAndRender();
        }
      }
    });
  }

  ['filterRole', 'filterEmail', 'filterName'].forEach(id => {
    container.querySelector('#' + id).oninput = fetchUsersAndRender;
    container.querySelector('#' + id).onchange = fetchUsersAndRender;
  });

  fetchUsersAndRender();
}
