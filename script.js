// ======================================================
// CREDOCONNECT - MAIN APPLICATION JAVASCRIPT
// ======================================================

"use strict";

// ======================================================
// 1. SUPABASE DATABASE & BACKEND CONFIGURATION
// ======================================================

const SUPABASE_URL = "https://euwsybgjtuwtzgivugan.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3QmVGhPnif-L8DpzWLcb4g_82dCyNj6";

// Change this to your deployed backend URL when pushed to production (e.g., Render)
const BACKEND_API_URL = "http://localhost:5000/api";

if (window.supabase && typeof window.supabase.createClient === "function") {
  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("CredoConnect database client initialized!");
} else {
  console.error("Supabase library not found. Check the Supabase script in index.html.");
}

// ======================================================
// 2. COMMON ELEMENT HELPERS & API UTILS
// ======================================================

function getElement(id) {
  return document.getElementById(id);
}

function addSafeListener(element, eventName, callback) {
  if (element) {
    element.addEventListener(eventName, callback);
  }
}

// Centralized Backend Fetch Helper
async function apiCall(endpoint, method = "GET", bodyData = null) {
  try {
    const headers = {
      "Content-Type": "application/json"
    };

    // Include Supabase auth token if available
    if (window.db) {
      const { data } = await window.db.auth.getSession();
      if (data?.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    }

    const options = {
      method,
      headers
    };

    if (bodyData) {
      options.body = JSON.stringify(bodyData);
    }

    const response = await fetch(`${BACKEND_API_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong with the server request.");
    }

    return result;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// ======================================================
// 3. NOTIFICATIONS
// ======================================================

function showToast(message) {
  const toast = getElement("toast");

  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ======================================================
// 4. PAGE NAVIGATION
// ======================================================

const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");
const pages = document.querySelectorAll(".page");
const pageTitle = getElement("pageTitle");
const sidebar = getElement("sidebar");

function showPage(pageId) {
  const targetPage = getElement(pageId);

  if (!targetPage) {
    console.error("Page not found:", pageId);
    return;
  }

  // Hide all pages
  pages.forEach(page => {
    page.classList.remove("active-page");
  });

  // Display selected page
  targetPage.classList.add("active-page");

  if (pageId === "account") {
    loadCustomerProfile();
  }

  if (pageId === "transactions") {
    fetchBackendTransactions();
  }

  // Update active navigation links
  navLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  // Update page heading
  if (pageTitle) {
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    pageTitle.textContent = activeLink
      ? activeLink.textContent.trim()
      : pageId.charAt(0).toUpperCase() + pageId.slice(1);
  }

  // Close mobile sidebar
  if (sidebar) {
    sidebar.classList.remove("open");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Desktop and mobile navigation listeners
navLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const pageId = link.dataset.page;
    if (pageId) {
      showPage(pageId);
    }
  });
});

// ======================================================
// 5. QUICK ACTIONS AND NETWORK SELECTION
// ======================================================

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.go);

    if (button.dataset.network) {
      const airtimeNetwork = getElement("airtimeNetwork");
      if (airtimeNetwork) {
        airtimeNetwork.value = button.dataset.network;
      }

      const bundleNetwork = getElement("bundleNetwork");
      if (bundleNetwork) {
        bundleNetwork.value = button.dataset.network;
      }
    }
  });
});

// ======================================================
// 6. MOBILE SIDEBAR & UI CONTROLS
// ======================================================

addSafeListener(getElement("menuToggle"), "click", () => {
  if (sidebar) {
    sidebar.classList.toggle("open");
  }
});

addSafeListener(document.querySelector(".notification-button"), "click", () => {
  showToast("You have no new notifications.");
});

// ======================================================
// 7. LIGHT AND DARK THEME
// ======================================================

const themeToggle = getElement("themeToggle");

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-theme", isLight);
  if (themeToggle) {
    themeToggle.textContent = isLight ? "☀" : "☾";
  }
}

addSafeListener(themeToggle, "click", () => {
  const isCurrentlyLight = document.body.classList.contains("light-theme");
  const newTheme = isCurrentlyLight ? "dark" : "light";
  applyTheme(newTheme);
  localStorage.setItem("credoTheme", newTheme);
});

const savedTheme = localStorage.getItem("credoTheme");
if (savedTheme === "light") {
  applyTheme("light");
}

// ======================================================
// 8. TRANSACTION DATA & STATE
// ======================================================

let transactions = [];

// ======================================================
// 9. PHONE NUMBER HELPERS
// ======================================================

function normalizePhone(phone) {
  let number = String(phone || "").replace(/\s+/g, "").replace(/-/g, "");

  if (number.startsWith("+254")) {
    number = "0" + number.slice(4);
  } else if (number.startsWith("254")) {
    number = "0" + number.slice(3);
  }

  return number;
}

function validKenyanPhone(phone) {
  const number = normalizePhone(phone);
  return /^0[17]\d{8}$/.test(number);
}

function maskPhone(phone) {
  const number = normalizePhone(phone);
  if (number.length !== 10) {
    return number;
  }
  return number.slice(0, 4) + " *** " + number.slice(-3);
}

// ======================================================
// 10. TRANSACTION RENDERING & FETCHING
// ======================================================

async function fetchBackendTransactions() {
  try {
    const response = await apiCall("/items"); // Fetches from your backend API
    if (response && response.data) {
      transactions = response.data.map(item => ({
        type: item.title || "Transaction",
        phone: maskPhone(item.description || "0700000000"),
        amount: item.amount || 100,
        date: new Date(item.created_at).toLocaleDateString("en-KE"),
        status: item.status || "Successful"
      }));
      renderTransactions();
    }
  } catch (error) {
    console.warn("Could not load remote records, using default view.", error);
    renderTransactions(); // Fallback render
  }
}

function renderTransactions() {
  const recentContainer = getElement("recentTransactions");
  const allContainer = getElement("allTransactions");

  const rows = transactions.map(transaction => {
    const statusClass = transaction.status === "Successful" ? "success" : "pending";

    return `
      <tr>
        <td>${transaction.type}</td>
        <td>${transaction.phone}</td>
        <td>KES ${Number(transaction.amount).toLocaleString("en-KE")}</td>
        <td>${transaction.date}</td>
        <td>
          <span class="status ${statusClass}">
            ${transaction.status}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  if (recentContainer) {
    recentContainer.innerHTML = rows ? rows : "<tr><td colspan='5'>No transactions yet.</td></tr>";
  }

  if (allContainer) {
    allContainer.innerHTML = rows ? rows : "<tr><td colspan='5'>No transactions yet.</td></tr>";
  }

  // Calculate statistics
  const successful = transactions.filter(t => t.status === "Successful");
  const pending = transactions.filter(t => t.status === "Pending");
  const totalSpent = successful.reduce((total, t) => total + Number(t.amount), 0);

  const totalTransactions = getElement("totalTransactions");
  const successfulTransactions = getElement("successfulTransactions");
  const pendingTransactions = getElement("pendingTransactions");
  const totalSpentElement = getElement("totalSpent");

  if (totalTransactions) totalTransactions.textContent = transactions.length;
  if (successfulTransactions) successfulTransactions.textContent = successful.length;
  if (pendingTransactions) pendingTransactions.textContent = pending.length;
  if (totalSpentElement) totalSpentElement.textContent = "KES " + totalSpent.toLocaleString("en-KE");
}

async function recordTransactionToServer(type, phone, amount) {
  try {
    // Send transaction data to your Node.js backend
    await apiCall("/items", "POST", {
      title: type,
      description: phone,
      amount: amount,
      status: "Pending"
    });
  } catch (error) {
    console.error("Failed to persist transaction on backend:", error);
  }

  // Update locally immediately for snappy UI
  transactions.unshift({
    type: type,
    phone: maskPhone(phone),
    amount: Number(amount),
    date: new Date().toLocaleDateString("en-KE"),
    status: "Pending"
  });

  renderTransactions();
}

// ======================================================
// 11. PURCHASE & FORM HANDLERS
// ======================================================

addSafeListener(getElement("airtimeForm"), "submit", async event => {
  event.preventDefault();

  const phone = normalizePhone(getElement("airtimePhone").value);
  const network = getElement("airtimeNetwork").value;
  const amount = Number(getElement("airtimeAmount").value);

  if (!validKenyanPhone(phone)) {
    showToast("Please enter a valid Kenyan phone number.");
    return;
  }

  if (!network) {
    showToast("Please select a network.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
    showToast("Enter an airtime amount between KES 10 and KES 10,000.");
    return;
  }

  await recordTransactionToServer(`Airtime - ${network}`, phone, amount);
  showToast("Airtime request recorded successfully.");
  event.target.reset();
  showPage("transactions");
});

addSafeListener(getElement("bundleForm"), "submit", async event => {
  event.preventDefault();

  const phone = normalizePhone(getElement("bundlePhone").value);
  const network = getElement("bundleNetwork").value;
  const amount = Number(getElement("bundleChoice").value);

  if (!validKenyanPhone(phone)) {
    showToast("Please enter a valid Kenyan phone number.");
    return;
  }

  if (!network || !Number.isFinite(amount) || amount <= 0) {
    showToast("Please select a network and bundle.");
    return;
  }

  await recordTransactionToServer(`Data Bundle - ${network}`, phone, amount);
  showToast("Data bundle request recorded successfully.");
  event.target.reset();
  showPage("transactions");
});

addSafeListener(getElement("bulkForm"), "submit", async event => {
  event.preventDefault();

  const numbers = getElement("bulkNumbers").value
    .split("\n")
    .map(num => normalizePhone(num.trim()))
    .filter(Boolean);

  const amount = Number(getElement("bulkAmount").value);

  if (!numbers.length) {
    showToast("Enter at least one phone number.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
    showToast("Enter a valid amount between KES 10 and KES 10,000.");
    return;
  }

  const invalidNumbers = numbers.filter(num => !validKenyanPhone(num));
  if (invalidNumbers.length > 0) {
    showToast("Some phone numbers are invalid. Please check your list.");
    return;
  }

  for (const number of numbers) {
    await recordTransactionToServer("Bulk Airtime", number, amount);
  }

  showToast(`${numbers.length} top-up requests recorded.`);
  event.target.reset();
  showPage("transactions");
});

// ======================================================
// 12. SCHEDULED TOP-UPS
// ======================================================

const scheduleDate = getElement("scheduleDate");

function getLocalDateString() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

const localToday = getLocalDateString();
if (scheduleDate) {
  scheduleDate.min = localToday;
}

addSafeListener(getElement("scheduleForm"), "submit", event => {
  event.preventDefault();

  const phone = normalizePhone(getElement("schedulePhone").value);
  const amount = Number(getElement("scheduleAmount").value);
  const date = scheduleDate ? scheduleDate.value : "";

  if (!validKenyanPhone(phone)) {
    showToast("Please enter a valid Kenyan phone number.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 10) {
    showToast("Enter an amount of at least KES 10.");
    return;
  }

  if (!date || date < localToday) {
    showToast("Choose a valid future date.");
    return;
  }

  showToast(`Schedule successfully saved for ${date}.`);
  event.target.reset();
  if (scheduleDate) {
    scheduleDate.min = getLocalDateString();
  }
});

// ======================================================
// 13. CUSTOMER ACCOUNT PROFILE
// ======================================================

async function loadCustomerProfile() {
  if (!window.db) {
    showToast("Database connection unavailable.");
    return;
  }

  try {
    const { data: userData, error: userError } = await window.db.auth.getUser();
    if (userError) throw userError;

    const user = userData.user;
    if (!user) {
      showPage("auth");
      return;
    }

    const { data: profile, error } = await window.db
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (profile) {
      getElement("profileFullName").value = profile.full_name || user.user_metadata?.full_name || "";
      getElement("profilePhone").value = profile.phone || user.user_metadata?.phone || "";
    }
    getElement("profileEmail").value = user.email || "";

    console.log("Customer profile loaded successfully.");
  } catch (error) {
    console.error("Profile loading error:", error);
    showToast("Unable to load your profile.");
  }
}

addSafeListener(getElement("saveAccount"), "click", async () => {
  if (!window.db) {
    showToast("Database connection unavailable.");
    return;
  }

  const fullName = getElement("profileFullName").value.trim();
  const phone = normalizePhone(getElement("profilePhone").value);

  if (!fullName) {
    showToast("Please enter your full name.");
    return;
  }

  if (!validKenyanPhone(phone)) {
    showToast("Please enter a valid Kenyan phone number.");
    return;
  }

  const button = getElement("saveAccount");
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const { data: userData, error: userError } = await window.db.auth.getUser();
    if (userError) throw userError;

    const user = userData.user;
    if (!user) {
      showPage("auth");
      return;
    }

    const { error } = await window.db
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        phone: phone,
        updated_at: new Date()
      });

    if (error) throw error;

    showToast("Your profile has been updated!");
  } catch (error) {
    console.error("Profile saving error:", error);
    showToast(error.message || "Unable to save profile.");
  } finally {
    button.disabled = false;
    button.textContent = "Save Changes";
  }
});

// ======================================================
// 14. AUTHENTICATION (LOGIN & REGISTRATION)
// ======================================================

const loginPanel = getElement("loginPanel");
const signupPanel = getElement("signupPanel");

addSafeListener(getElement("showSignup"), "click", () => {
  if (loginPanel) loginPanel.hidden = true;
  if (signupPanel) signupPanel.hidden = false;
});

addSafeListener(getElement("showLogin"), "click", () => {
  if (signupPanel) signupPanel.hidden = true;
  if (loginPanel) loginPanel.hidden = false;
});

addSafeListener(getElement("authSignupForm"), "submit", async event => {
  event.preventDefault();

  if (!window.db) {
    showToast("Database connection is unavailable.");
    return;
  }

  const fullName = getElement("signupName").value.trim();
  const phone = normalizePhone(getElement("signupPhone").value);
  const email = getElement("signupEmail").value.trim();
  const password = getElement("signupPassword").value;

  if (!validKenyanPhone(phone)) {
    showToast("Please enter a valid Kenyan phone number.");
    return;
  }

  if (password.length < 8) {
    showToast("Password must contain at least 8 characters.");
    return;
  }

  const submitButton = event.submitter;
  if (submitButton) submitButton.disabled = true;

  try {
    const { data, error } = await window.db.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { full_name: fullName, phone: phone }
      }
    });

    if (error) throw error;

    if (data.session) {
      showToast("Account created successfully!");
      event.target.reset();
      showPage("dashboard");
    } else {
      showToast("Account created! Check your email to verify.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showToast(error.message || "Registration failed.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

addSafeListener(getElement("authLoginForm"), "submit", async event => {
  event.preventDefault();

  if (!window.db) {
    showToast("Database connection is unavailable.");
    return;
  }

  const email = getElement("loginEmail").value.trim();
  const password = getElement("loginPassword").value;

  const submitButton = event.submitter;
  if (submitButton) submitButton.disabled = true;

  try {
    const { error } = await window.db.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    showToast("Welcome back!");
    event.target.reset();
    showPage("dashboard");
  } catch (error) {
    console.error("Login error:", error);
    showToast(error.message || "Login failed.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

async function checkCustomerSession() {
  if (!window.db) {
    showPage("auth");
    return;
  }

  try {
    const { data, error } = await window.db.auth.getSession();
    if (error) throw error;

    if (data.session) {
      showPage("dashboard");
    } else {
      showPage("auth");
    }
  } catch (error) {
    console.error("Session check failed:", error);
    showPage("auth");
  }
}

checkCustomerSession();

// ======================================================
// 15. SERVICE WORKER REGISTRATION & STARTUP
// ======================================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(registration => {
        console.log("CredoConnect service worker activated:", registration.scope);
      })
      .catch(error => {
        console.error("Service worker registration failed:", error);
      });
  });
}

renderTransactions();
console.log("CredoConnect updated script loaded successfully.");
