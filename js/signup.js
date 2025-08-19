export function initSignup(container, auth) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <label>Username:<br/>
        <input type="text" id="username" required autocomplete="off" />
        <span id="usernameStatus" class="status"></span>
      </label><br/>

      <label>Full Name:<br/>
        <input type="text" id="name" required />
        <span id="nameError" class="feedback-red"></span>
      </label><br/>

      <label>Email:<br/>
        <input type="email" id="email" required autocomplete="off" />
        <span id="emailStatus" class="status"></span>
      </label><br/>

      <label>Password:<br/>
        <input type="password" id="password" required />
        <button type="button" id="togglePassword">Show</button>
        <span id="passwordStrength" class="status"></span>
      </label><br/>

      <label>Confirm Password:<br/>
        <input type="password" id="confirmPassword" required />
        <button type="button" id="toggleConfirmPassword">Show</button>
        <span id="confirmError" class="feedback-red"></span>
      </label><br/>

      <label>
        <input type="checkbox" id="terms" required />
        I agree to the <a href="#" target="_blank">Terms & Privacy Policy</a>
      </label><br/>

      <button type="submit" id="submitBtn">Sign Up</button>
      <span id="formError" class="feedback-red"></span>
    </form>
  `;

  const usernameInput = container.querySelector("#username");
  const usernameStatus = container.querySelector("#usernameStatus");
  const nameInput = container.querySelector("#name");
  const nameError = container.querySelector("#nameError");
  const emailInput = container.querySelector("#email");
  const emailStatus = container.querySelector("#emailStatus");
  const passwordInput = container.querySelector("#password");
  const togglePassword = container.querySelector("#togglePassword");
  const passwordStrength = container.querySelector("#passwordStrength");
  const confirmPasswordInput = container.querySelector("#confirmPassword");
  const toggleConfirmPassword = container.querySelector("#toggleConfirmPassword");
  const confirmError = container.querySelector("#confirmError");
  const termsCheckbox = container.querySelector("#terms");
  const submitBtn = container.querySelector("#submitBtn");
  const formError = container.querySelector("#formError");

  let usernameValid = false;
  let emailValid = false;
  let nameValid = false;
  let passwordValid = false;
  let confirmValid = false;

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  function validateUsernameFormat(name) {
    return /^[a-z0-9]+$/.test(name);
  }

  function validateNameFormat(name) {
    return /^[a-zA-Z\s]+$/.test(name);
  }

  function validatePasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[\W_]/.test(pw)) score++;
    return score;
  }

  function updatePasswordStrengthUI(score) {
    const texts = ["Very Weak", "Weak", "Moderate", "Good", "Strong"];
    const colors = ["#dd4b39", "#f39c12", "#f1c40f", "#27ae60", "#2ecc71"];
    passwordStrength.textContent = texts[score];
    passwordStrength.style.color = colors[score];
    passwordValid = score >= 3;
  }

  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.textContent = type === "password" ? "Show" : "Hide";
  });

  toggleConfirmPassword.addEventListener("click", () => {
    const type = confirmPasswordInput.type === "password" ? "text" : "password";
    confirmPasswordInput.type = type;
    toggleConfirmPassword.textContent = type === "password" ? "Show" : "Hide";
  });

  usernameInput.addEventListener(
    "blur",
    debounce(async () => {
      const username = usernameInput.value.trim().toLowerCase();
      usernameStatus.textContent = "";
      usernameInput.classList.remove("error", "valid");
      usernameValid = false;
      if (!validateUsernameFormat(username)) {
        usernameStatus.textContent = "Lowercase letters and digits only";
        usernameStatus.style.color = "red";
        usernameInput.classList.add("error");
        return;
      }
      usernameStatus.innerHTML = '<span class="loader"></span>';
      try {
        const res = await fetch("https://holy-fog-231f.nafil-8895-s.workers.dev/api/check-unique", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        if (data.usernameAvailable) {
          usernameStatus.textContent = "Username available";
          usernameStatus.style.color = "green";
          usernameInput.classList.add("valid");
          usernameValid = true;
        } else {
          usernameStatus.textContent = "Username already taken";
          usernameStatus.style.color = "red";
          usernameInput.classList.add("error");
        }
      } catch {
        usernameStatus.textContent = "Check failed, try again";
        usernameStatus.style.color = "red";
        usernameInput.classList.add("error");
      }
    }, 400)
  );

  nameInput.addEventListener("blur", () => {
    const name = nameInput.value.trim();
    if (!validateNameFormat(name)) {
      nameError.textContent = "Only letters and spaces allowed";
      nameInput.classList.add("error");
      nameValid = false;
    } else {
      nameError.textContent = "";
      nameInput.classList.remove("error");
      nameValid = true;
    }
  });

  emailInput.addEventListener(
    "blur",
    debounce(async () => {
      const email = emailInput.value.trim().toLowerCase();
      emailStatus.textContent = "";
      emailInput.classList.remove("error", "valid");
      emailValid = false;
      if (!emailInput.checkValidity()) {
        emailStatus.textContent = "Invalid email format";
        emailStatus.style.color = "red";
        emailInput.classList.add("error");
        return;
      }
      emailStatus.innerHTML = '<span class="loader"></span>';
      try {
        const res = await fetch("https://signup-worker-subdomain.workers.dev/api/check-unique", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.emailAvailable) {
          emailStatus.textContent = "Email available";
          emailStatus.style.color = "green";
          emailInput.classList.add("valid");
          emailValid = true;
        } else {
          emailStatus.textContent = "Email already in use";
          emailStatus.style.color = "red";
          emailInput.classList.add("error");
        }
      } catch {
        emailStatus.textContent = "Check failed, try again";
        emailStatus.style.color = "red";
        emailInput.classList.add("error");
      }
    }, 400)
  );

  passwordInput.addEventListener("input", () => {
    const score = validatePasswordStrength(passwordInput.value);
    updatePasswordStrengthUI(score);
  });

  confirmPasswordInput.addEventListener("blur", () => {
    if (confirmPasswordInput.value !== passwordInput.value) {
      confirmError.textContent = "Passwords do not match";
      confirmPasswordInput.classList.add("error");
      confirmValid = false;
    } else {
      confirmError.textContent = "";
      confirmPasswordInput.classList.remove("error");
      confirmValid = true;
    }
  });

  container.querySelector("#signupForm").addEventListener("submit", async e => {
    e.preventDefault();
    formError.textContent = "";

    if (!usernameValid) {
      formError.textContent = "Please fix username errors";
      usernameInput.focus();
      return;
    }
    if (!nameValid) {
      formError.textContent = "Please fix name errors";
      nameInput.focus();
      return;
    }
    if (!emailValid) {
      formError.textContent = "Please fix email errors";
      emailInput.focus();
      return;
    }
    if (!passwordValid) {
      formError.textContent = "Please choose a stronger password";
      passwordInput.focus();
      return;
    }
    if (!confirmValid) {
      formError.textContent = "Passwords do not match";
      confirmPasswordInput.focus();
      return;
    }
    if (!termsCheckbox.checked) {
      formError.textContent = "You must accept the terms";
      termsCheckbox.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait...";

    try {
      const checkRes = await fetch("https://holy-fog-231f.nafil-8895-s.workers.dev/api/check-unique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput.value, email: emailInput.value }),
      });
      const checkData = await checkRes.json();

      if (!checkData.usernameAvailable) {
        formError.textContent = "Username taken, please choose another";
        usernameInput.focus();
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
        return;
      }

      if (!checkData.emailAvailable) {
        formError.textContent = "Email already in use";
        emailInput.focus();
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
        return;
      }
    } catch {
      formError.textContent = "Server error during validation";
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign Up";
      return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
      await userCredential.user.sendEmailVerification();

      const profileRes = await fetch("https://holy-fog-231f.nafil-8895-s.workers.dev/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userCredential.user.uid,
          username: usernameInput.value.toLowerCase(),
          email: emailInput.value.toLowerCase(),
          name: nameInput.value,
          emailVerified: 0,
          adminApproval: "pending",
          role: "user",
        }),
      });

      if (!profileRes.ok) {
        formError.textContent = "Failed to save profile";
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
        return;
      }

      alert("Registration successful! Please verify your email before logging in.");
      window.location.hash = "#login";
    } catch (err) {
      formError.textContent = err.message || "Registration failed";
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign Up";
    }
  });
}
