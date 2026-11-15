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
const BACKEND_API_URL = "https://credoconnect.onrender.com/api";

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

const navLinks = document.querySelectorAll(
  ".nav-link, .mobile-nav-link"
);

const pages = document.querySelectorAll(".page");
const sidebar = getElement("sidebar");

function showPage(pageId) {
  const targetPage = getElement(pageId);

  if (!targetPage) {
    console.error("Page not found:", pageId);
    return;
  }

  pages.forEach(page => {
    page.classList.remove("active-page");
  });

  targetPage.classList.add("active-page");

  navLinks.forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.page === pageId
    );
  });

  if (pageId === "account") {
    loadCustomerProfile();
  }

  if (pageId === "transactions") {
    fetchBackendTransactions();
  }

  if (pageId === "favourites") {
    renderFavourites();
  }

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// Handle all navigation buttons and links
document.querySelectorAll("[data-page]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showPage(link.dataset.page);
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
    const response = await apiCall("/items");

    if (response && Array.isArray(response.data)) {
      transactions = response.data.map(item => {
        const title = item.title || "Transaction";
        const networkMatch = title.match(/Safaricom|Airtel|Telkom|Equitel|Faiba/i);

        const statusText = String(item.status || "Pending");
        const normalizedStatus =
          /success|completed/i.test(statusText) ? "Successful" :
          /fail|cancel/i.test(statusText) ? "Failed" :
          "Pending";

        return {
          service: /bundle|data/i.test(title) ? "Data Bundle" : "Airtime",
          network: item.network || (networkMatch ? networkMatch[0] : "—"),
          phone: maskPhone(item.description || ""),
          amount: Number(item.amount || 0),
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-KE")
            : "—",
          status: normalizedStatus
        };
      });

      renderTransactions();
    }
  } catch (error) {
    console.warn("Could not load remote transactions:", error);
    renderTransactions();
  }
}


// Escape dynamic text before inserting it into HTML
function escapeTransactionText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}


// Create a transaction table row
function createTransactionRow(transaction) {
  const status = transaction.status || "Pending";

  const statusClass =
    status === "Successful" ? "success" :
    status === "Failed" ? "failed" :
    "pending";

  return `
    <tr>
      <td>${escapeTransactionText(transaction.date)}</td>
      <td>${escapeTransactionText(transaction.service)}</td>
      <td>${escapeTransactionText(transaction.network)}</td>
      <td>KES ${Number(transaction.amount || 0).toLocaleString("en-KE")}</td>
      <td>
        <span class="status ${statusClass}">
          ${escapeTransactionText(status)}
        </span>
      </td>
    </tr>
  `;
}


// Render recent and complete transaction history
function renderTransactions() {
  const recentContainer = getElement("recentTransactions");
  const allContainer = getElement("allTransactions");

  const recentTransactions = transactions.slice(0, 5);

  const recentRows = recentTransactions
    .map(createTransactionRow)
    .join("");

  const allRows = transactions
    .map(createTransactionRow)
    .join("");

  if (recentContainer) {
    recentContainer.innerHTML = recentRows ||
      "<tr><td colspan='5'>No transactions yet.</td></tr>";
  }

  if (allContainer) {
    allContainer.innerHTML = allRows ||
      "<tr><td colspan='5'>No transactions yet.</td></tr>";
  }

  // Calculate dashboard statistics
  const successful = transactions.filter(
    transaction => transaction.status === "Successful"
  );

  const pending = transactions.filter(
    transaction => transaction.status === "Pending"
  );

  const totalSpent = successful.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0
  );

  const totalTransactions = getElement("totalTransactions");
  const successfulTransactions = getElement("successfulTransactions");
  const pendingTransactions = getElement("pendingTransactions");
  const totalSpentElement = getElement("totalSpent");

  if (totalTransactions) {
    totalTransactions.textContent = transactions.length;
  }

  if (successfulTransactions) {
    successfulTransactions.textContent = successful.length;
  }

  if (pendingTransactions) {
    pendingTransactions.textContent = pending.length;
  }

  if (totalSpentElement) {
    totalSpentElement.textContent =
      "KES " + totalSpent.toLocaleString("en-KE");
  }
}


// ======================================================
// 11. M-PESA STK PUSH & FORM HANDLERS
// ======================================================

async function triggerMpesaStkPush(phone, amount, description) {
  try {
    const response = await apiCall("/mpesa/stkpush", "POST", {
      phone: phone,
      amount: amount
    });

    showToast(response.message || "STK Push sent! Check your phone to enter your PIN.");
    
    // Add locally as pending
    transactions.unshift({
      type: description,
      phone: maskPhone(phone),
      amount: Number(amount),
      date: new Date().toLocaleDateString("en-KE"),
      status: "Pending"
    });
    renderTransactions();

    return true;
  } catch (error) {
    console.error("M-Pesa payment error:", error);
    showToast(error.message || "Failed to initiate M-Pesa payment.");
    return false;
  }
}

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

  const submitButton = event.submitter;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending STK Push...";
  }

  const success = await triggerMpesaStkPush(phone, amount, `Airtime - ${network}`);
  
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "Pay with M-Pesa";
  }

  if (success) {
    event.target.reset();
    showPage("transactions");
  }
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

  const submitButton = event.submitter;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending STK Push...";
  }

  const success = await triggerMpesaStkPush(phone, amount, `Data Bundle - ${network}`);

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "Pay with M-Pesa";
  }

  if (success) {
    event.target.reset();
    showPage("transactions");
  }
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

  const submitButton = event.submitter;
  if (submitButton) submitButton.disabled = true;

  for (const number of numbers) {
    await triggerMpesaStkPush(number, amount, "Bulk Airtime");
  }

  if (submitButton) submitButton.disabled = false;

  showToast(`${numbers.length} STK push requests sent.`);
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
// ======================================================
// CUSTOMER LOGOUT
// ======================================================

addSafeListener(getElement("logoutButton"), "click", async event => {
  event.preventDefault();

  if (!window.db) {
    showToast("Database connection unavailable.");
    return;
  }

  try {
    const { error } = await window.db.auth.signOut();

    if (error) throw error;

    showToast("You have successfully logged out.");

    showPage("auth");

  } catch (error) {
    console.error("Logout error:", error);
    showToast(error.message || "Unable to log out.");
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
