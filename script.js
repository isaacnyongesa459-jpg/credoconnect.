
"use strict";

/* =========================================================
   CREDOCONNECT — MAIN APPLICATION SCRIPT
   Networks: Safaricom and Airtel
   ========================================================= */

/* 1. CONFIGURATION */

const SUPABASE_URL = "https://euwsybgjtuwtzgivugan.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3QmVGhPnif-L8DpzWLcb4g_82dCyNj6";

const BACKEND_API_URL = "https://credoconnect.onrender.com/api";
const DONATION_NUMBER = "0798491209";

if (window.supabase?.createClient) {
  window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} else {
  console.error("Supabase library is missing.");
}

/* 2. HELPERS */

const $ = id => document.getElementById(id);

function listen(element, event, callback) {
  if (element) element.addEventListener(event, callback);
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.credoToastTimer);

  window.credoToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

async function apiCall(endpoint, method = "GET", body = null) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (window.db) {
    const { data } = await window.db.auth.getSession();

    if (data?.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  }

  const options = { method, headers };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND_API_URL}${endpoint}`, options);

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      result.message || "The server could not complete your request."
    );
  }

  return result;
}

/* 3. KENYAN PHONE NUMBER VALIDATION */

function normalizePhone(phone) {
  let number = String(phone || "").replace(/[\s-]/g, "");

  if (number.startsWith("+254")) {
    number = "0" + number.slice(4);
  } else if (number.startsWith("254")) {
    number = "0" + number.slice(3);
  }

  return number;
}

function validKenyanPhone(phone) {
  return /^0[17]\d{8}$/.test(normalizePhone(phone));
}

function formatPhoneForMpesa(phone) {
  return "254" + normalizePhone(phone).slice(1);
}

/* 4. PAGE NAVIGATION */

const pages = document.querySelectorAll(".page");
const navigationLinks = document.querySelectorAll(
  ".nav-link[data-page], .mobile-nav-link[data-page]"
);

function showPage(pageId) {
  const target = $(pageId);

  if (!target) {
    console.warn("Page not found:", pageId);
    return;
  }

  pages.forEach(page => page.classList.remove("active-page"));
  target.classList.add("active-page");

  navigationLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  $("sidebar")?.classList.remove("open");

  if (pageId === "transactions") {
    loadTransactions();
  }

  if (pageId === "account") {
    loadCustomerProfile();
  }

  if (pageId === "favourites") {
    renderFavourites();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showPage(link.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    const destination = button.dataset.go;
    showPage(destination);

    const network = button.dataset.network;

    if (network) {
      if ($("airtimeNetwork")) $("airtimeNetwork").value = network;
      if ($("bundleNetwork")) $("bundleNetwork").value = network;
    }
  });
});

/* 5. MOBILE MENU */

listen($("menuToggle"), "click", () => {
  $("sidebar")?.classList.toggle("open");
});

/* 6. LIGHT AND DARK THEME */

function applyTheme(theme) {
  document.body.dataset.theme = theme;

  document.querySelectorAll("#themeToggle").forEach(button => {
    button.textContent = theme === "dark" ? "☀" : "☾";
    button.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  });

  localStorage.setItem("credoTheme", theme);
}

applyTheme(localStorage.getItem("credoTheme") || "light");

document.querySelectorAll("#themeToggle").forEach(button => {
  button.addEventListener("click", () => {
    const current = document.body.dataset.theme || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
});

/* 7. TRANSACTIONS */

let transactions = [];

function maskPhone(phone) {
  const number = normalizePhone(phone);

  if (number.length !== 10) return number;

  return `${number.slice(0, 4)} *** ${number.slice(-3)}`;
}

function transactionStatus(status) {
  const value = String(status || "Pending").toLowerCase();

  if (value.includes("success") || value.includes("complete")) {
    return "Successful";
  }

  if (value.includes("fail") || value.includes("cancel")) {
    return "Failed";
  }

  return "Pending";
}

function createTransactionRow(item) {
  const status = transactionStatus(item.status);
  const statusClass = status.toLowerCase();

  const title = item.title || "Transaction";
  const network = item.network ||
    (title.match(/Safaricom|Airtel/i)?.[0] || "—");

  const date = item.created_at
    ? new Date(item.created_at).toLocaleString("en-KE")
    : "—";

  return `
    <tr>
      <td>${escapeHTML(date)}</td>
      <td>${escapeHTML(title)}</td>
      <td>${escapeHTML(network)}</td>
      <td>KES ${Number(item.amount || 0).toLocaleString("en-KE")}</td>
      <td><span class="status ${statusClass}">${status}</span></td>
    </tr>
  `;
}

function renderTransactions() {
  const rows = transactions.map(createTransactionRow).join("");

  const emptyRow = `
    <tr>
      <td colspan="5">No transactions found.</td>
    </tr>
  `;

  if ($("recentTransactions")) {
    $("recentTransactions").innerHTML =
      transactions.slice(0, 5).map(createTransactionRow).join("") || emptyRow;
  }

  if ($("allTransactions")) {
    $("allTransactions").innerHTML = rows || emptyRow;
  }

  const successful = transactions.filter(
    item => transactionStatus(item.status) === "Successful"
  );

  const pending = transactions.filter(
    item => transactionStatus(item.status) === "Pending"
  );

  const totalSpent = successful.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  if ($("totalTransactions")) {
    $("totalTransactions").textContent = transactions.length;
  }

  if ($("successfulTransactions")) {
    $("successfulTransactions").textContent = successful.length;
  }

  if ($("pendingTransactions")) {
    $("pendingTransactions").textContent = pending.length;
  }

  if ($("totalSpent")) {
    $("totalSpent").textContent =
      `KES ${totalSpent.toLocaleString("en-KE")}`;
  }
}

async function loadTransactions() {
  try {
    const response = await apiCall("/items");

    if (Array.isArray(response.data)) {
      transactions = response.data;
      renderTransactions();
    }
  } catch (error) {
    console.error("Transaction loading error:", error);
    showToast("Could not load transaction history.");
  }
}

/* 8. M-PESA STK PUSH */

async function triggerMpesaStkPush(phone, amount, description) {
  try {
    const response = await apiCall("/mpesa/stkpush", "POST", {
      phone: formatPhoneForMpesa(phone),
      amount: Number(amount)
    });

    if (!response.success) {
      throw new Error(response.message || "M-Pesa request failed.");
    }

    showToast(
      "M-Pesa prompt requested. Check your phone and enter your M-Pesa PIN."
    );

    console.log("M-Pesa STK response:", response.data);

    return true;
  } catch (error) {
    console.error("M-Pesa error:", error);
    showToast(error.message || "Unable to send M-Pesa prompt.");
    return false;
  }
}

/* 9. AIRTIME PURCHASE FORM */

listen($("airtimeForm"), "submit", async event => {
  event.preventDefault();

  const phone = normalizePhone($("airtimePhone")?.value);
  const network = $("airtimeNetwork")?.value;
  const amount = Number($("airtimeAmount")?.value);

  if (!validKenyanPhone(phone)) {
    showToast("Enter a valid Kenyan phone number.");
    return;
  }

  if (!["Safaricom", "Airtel"].includes(network)) {
    showToast("Choose Safaricom or Airtel.");
    return;
  }

  if (!Number.isInteger(amount) || amount < 10 || amount > 10000) {
    showToast("Enter an amount between KES 10 and KES 10,000.");
    return;
  }

  const button = event.submitter;
  const originalText = button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent = "Requesting payment...";
  }

  const success = await triggerMpesaStkPush(
    phone,
    amount,
    `Airtime - ${network}`
  );

  if (button) {
    button.disabled = false;
    button.textContent = originalText || "Pay with M-Pesa";
  }

  if (success) {
    event.target.reset();
  }
});

/* 10. INTERNET BUNDLE FORM */

listen($("bundleForm"), "submit", async event => {
  event.preventDefault();

  const phone = normalizePhone($("bundlePhone")?.value);
  const network = $("bundleNetwork")?.value;
  const amount = Number($("bundleChoice")?.value);

  if (!validKenyanPhone(phone)) {
    showToast("Enter a valid Kenyan phone number.");
    return;
  }

  if (!["Safaricom", "Airtel"].includes(network)) {
    showToast("Choose Safaricom or Airtel.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Choose an available bundle first.");
    return;
  }

  const button = event.submitter;
  const originalText = button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent = "Requesting payment...";
  }

  const success = await triggerMpesaStkPush(
    phone,
    amount,
    `Internet Bundle - ${network}`
  );

  if (button) {
    button.disabled = false;
    button.textContent = originalText || "Pay with M-Pesa";
  }

  if (success) {
    event.target.reset();
  }
});

/* 11. SMS AND MINUTES FORMS
   These handlers only request payment.
   Actual SMS/minutes fulfilment needs a provider API. */

async function handleSimplePurchaseForm(event, productName) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const phone =
    normalizePhone(formData.get("phone") ||
      form.querySelector('input[type="tel"]')?.value);

  const amount = Number(
    formData.get("amount") ||
    form.querySelector('[name="amount"]')?.value ||
    form.querySelector('input[type="number"]')?.value
  );

  if (!validKenyanPhone(phone)) {
    showToast("Enter a valid Kenyan phone number.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast(`Select a valid ${productName} package.`);
    return;
  }

  const button = event.submitter;
  if (button) button.disabled = true;

  const success = await triggerMpesaStkPush(phone, amount, productName);

  if (button) button.disabled = false;

  if (success) form.reset();
}

listen($("smsForm"), "submit", event => {
  handleSimplePurchaseForm(event, "SMS Package");
});

listen($("minutesForm"), "submit", event => {
  handleSimplePurchaseForm(event, "Minutes Package");
});

/* 12. CUSTOMER PROFILE */

async function loadCustomerProfile() {
  if (!window.db) return;

  try {
    const { data, error } = await window.db.auth.getUser();

    if (error) throw error;

    const user = data.user;

    if (!user) {
      showPage("auth");
      return;
    }

    const { data: profile, error: profileError } = await window.db
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if ($("profileFullName")) {
      $("profileFullName").value =
        profile?.full_name || user.user_metadata?.full_name || "";
    }

    if ($("profilePhone")) {
      $("profilePhone").value =
        profile?.phone || user.user_metadata?.phone || "";
    }

    if ($("profileEmail")) {
      $("profileEmail").value = user.email || "";
    }
  } catch (error) {
    console.error("Profile loading error:", error);
    showToast("Unable to load your account details.");
  }
}

listen($("saveAccount"), "click", async () => {
  if (!window.db) {
    showToast("Database connection unavailable.");
    return;
  }

  const fullName = $("profileFullName")?.value.trim();
  const phone = normalizePhone($("profilePhone")?.value);

  if (!fullName) {
    showToast("Enter your full name.");
    return;
  }

  if (!validKenyanPhone(phone)) {
    showToast("Enter a valid Kenyan phone number.");
    return;
  }

  const button = $("saveAccount");
  button.disabled = true;

  try {
    const { data, error: userError } = await window.db.auth.getUser();

    if (userError) throw userError;
    if (!data.user) throw new Error("Please sign in first.");

    const { error } = await window.db.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      phone,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    showToast("Account details saved successfully.");
  } catch (error) {
    console.error(error);
    showToast(error.message || "Could not save your profile.");
  } finally {
    button.disabled = false;
  }
});

/* 13. LOGIN AND REGISTRATION */

listen($("showSignup"), "click", () => {
  if ($("loginPanel")) $("loginPanel").hidden = true;
  if ($("signupPanel")) $("signupPanel").hidden = false;
});

listen($("showLogin"), "click", () => {
  if ($("signupPanel")) $("signupPanel").hidden = true;
  if ($("loginPanel")) $("loginPanel").hidden = false;
});

listen($("authSignupForm"), "submit", async event => {
  event.preventDefault();

  if (!window.db) {
    showToast("Database connection unavailable.");
    return;
  }

  const fullName = $("signupName")?.value.trim();
  const phone = normalizePhone($("signupPhone")?.value);
  const email = $("signupEmail")?.value.trim();
  const password = $("signupPassword")?.value;

  if (!fullName) {
    showToast("Enter your full name.");
    return;
  }

  if (!validKenyanPhone(phone)) {
    showToast("Enter a valid Kenyan phone number.");
    return;
  }

  if (!email || !password || password.length < 8) {
    showToast("Enter an email and a password of at least 8 characters.");
    return;
  }

  const button = event.submitter;
  if (button) button.disabled = true;

  try {
    const { data, error } = await window.db.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone
        }
      }
    });

    if (error) throw error;

    event.target.reset();

    if (data.session) {
      showToast("Your account has been created.");
      showPage("dashboard");
    } else {
      showToast("Account created. Check your email to verify your address.");
    }
  } catch (error) {
    console.error("Signup error:", error);
    showToast(error.message || "Registration failed.");
  } finally {
    if (button) button.disabled = false;
  }
});

listen($("authLoginForm"), "submit", async event => {
  event.preventDefault();

  if (!window.db) {
    showToast("Database connection unavailable.");
    return;
  }

  const email = $("loginEmail")?.value.trim();
  const password = $("loginPassword")?.value;

  const button = event.submitter;
  if (button) button.disabled = true;

  try {
    const { error } = await window.db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    event.target.reset();
    showToast("Welcome back to CredoConnect.");
    showPage("dashboard");
  } catch (error) {
    console.error("Login error:", error);
    showToast(error.message || "Login failed.");
  } finally {
    if (button) button.disabled = false;
  }
});


/* 14. CUSTOMER LOGOUT */

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", async function (event) {
    event.preventDefault();

    console.log("Logout button clicked.");

    if (!window.db) {
      showToast("Database connection unavailable.");
      console.error("Supabase client is not initialized.");
      return;
    }

    logoutButton.style.pointerEvents = "none";

    try {
      const { error } = await window.db.auth.signOut({
        scope: "local"
      });

      if (error) throw error;

      showToast("You have successfully logged out.");

      // Return the customer to the login page.
      if (document.getElementById("auth")) {
        showPage("auth");
      } else {
        window.location.reload();
      }

    } catch (error) {
      console.error("Logout error:", error);
      showToast(error.message || "Unable to log out.");

    } finally {
      logoutButton.style.pointerEvents = "";
    }
  });

  console.log("Logout handler attached successfully.");

} else {
  console.error("Logout button not found.");
}


/* 15. FAVOURITE NUMBERS */

function getFavourites() {
  try {
    return JSON.parse(localStorage.getItem("credoFavourites") || "[]");
  } catch {
    return [];
  }
}

function saveFavourites(items) {
  localStorage.setItem("credoFavourites", JSON.stringify(items));
}

function renderFavourites() {
  const container =
    $("favouriteNumbersList") || $("allFavouriteNumbers");

  if (!container) return;

  const favourites = getFavourites();

  if (!favourites.length) {
    container.innerHTML = "<p>No saved numbers yet.</p>";
    return;
  }

  container.innerHTML = favourites.map((item, index) => `
    <div class="favourite-item">
      <div class="favourite-details">
        <strong>${escapeHTML(item.name || "Saved number")}</strong>
        <p>${escapeHTML(item.phone)}</p>
        <small>${escapeHTML(item.network || "")}</small>
      </div>
      <button type="button" class="favourite-buy"
        data-favourite-buy="${index}">Top Up</button>
      <button type="button" data-favourite-delete="${index}"
        aria-label="Remove favourite">Remove</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-favourite-buy]").forEach(button => {
    button.addEventListener("click", () => {
      const item = favourites[Number(button.dataset.favouriteBuy)];

      showPage("airtime");

      if ($("airtimePhone")) $("airtimePhone").value = item.phone;
      if ($("airtimeNetwork") && item.network) {
        $("airtimeNetwork").value = item.network;
      }
    });
  });

  container.querySelectorAll("[data-favourite-delete]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.favouriteDelete);
      favourites.splice(index, 1);
      saveFavourites(favourites);
      renderFavourites();
      showToast("Favourite removed.");
    });
  });
}

/* Optional favourite-save form or button.
   Add data-save-favourite to a button to enable this action. */

document.querySelectorAll("[data-save-favourite]").forEach(button => {
  button.addEventListener("click", () => {
    const phone = normalizePhone(
      button.dataset.phone || $("airtimePhone")?.value
    );

    const network =
      button.dataset.network || $("airtimeNetwork")?.value || "";

    if (!validKenyanPhone(phone)) {
      showToast("Enter a valid phone number first.");
      return;
    }

    const favourites = getFavourites();

    if (favourites.some(item => item.phone === phone)) {
      showToast("That number is already saved.");
      return;
    }

    favourites.push({
      name: button.dataset.name || "Saved number",
      phone,
      network
    });

    saveFavourites(favourites);
    showToast("Number added to favourites.");
  });
});

/* 16. DONATION NUMBER COPY */

listen($("donateCopyNumber"), "click", async () => {
  try {
    await navigator.clipboard.writeText(DONATION_NUMBER);
    showToast("M-Pesa number copied.");
  } catch {
    showToast(`Send your donation to ${DONATION_NUMBER}.`);
  }
});

/* 17. NOTIFICATIONS */

document.querySelectorAll(
  ".notification-button, [data-notifications]"
).forEach(button => {
  button.addEventListener("click", () => {
    showToast("You have no new notifications.");
  });
});

/* 18. SCHEDULE DATE VALIDATION */

function localDateString() {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}

if ($("scheduleDate")) {
  $("scheduleDate").min = localDateString();
}

listen($("scheduleForm"), "submit", event => {
  event.preventDefault();

  const phone = normalizePhone($("schedulePhone")?.value);
  const amount = Number($("scheduleAmount")?.value);
  const date = $("scheduleDate")?.value;

  if (!validKenyanPhone(phone)) {
    showToast("Enter a valid Kenyan phone number.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 10) {
    showToast("Enter an amount of at least KES 10.");
    return;
  }

  if (!date || date < localDateString()) {
    showToast("Choose a valid date.");
    return;
  }

  showToast("Schedule details checked. Automatic scheduled payments are not enabled yet.");
});

/* 19. AUTHENTICATION SESSION CHECK */

async function checkSession() {
  if (!window.db) return;

  try {
    const { data, error } = await window.db.auth.getSession();

    if (error) throw error;

    if (data.session) {
      console.log("Customer is signed in.");
    } else {
      console.log("No active customer session.");
    }
  } catch (error) {
    console.error("Session check failed:", error);
  }
}

if (window.db) {
  window.db.auth.onAuthStateChange((event, session) => {
    console.log("Authentication event:", event);

    if (event === "SIGNED_OUT") {
      showPage("auth");
    }
  });

  checkSession();
}

/* 20. SERVICE WORKER */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(registration => {
        console.log("CredoConnect service worker registered.");
      })
      .catch(error => {
        console.error("Service worker registration failed:", error);
      });
  });
}

/* 21. APPLICATION STARTUP */

renderTransactions();
renderFavourites();

console.log("CredoConnect application initialized.");
