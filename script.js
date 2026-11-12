
// ======================================================
// CREDOCONNECT - MAIN APPLICATION JAVASCRIPT
// ======================================================

"use strict";

// ======================================================
// 1. SUPABASE DATABASE CONNECTION
// ======================================================

const SUPABASE_URL = "https://euwsybgjtuwtzgivugan.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_3QmVGhPnif-L8DpzWLcb4g_82dCyNj6";

if (
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {
  window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  console.log("CredoConnect database client initialized!");
} else {
  console.error(
    "Supabase library not found. Check the Supabase script in index.html."
  );
}

// ======================================================
// 2. COMMON ELEMENT HELPERS
// ======================================================

function getElement(id) {
  return document.getElementById(id);
}

function addSafeListener(element, eventName, callback) {
  if (element) {
    element.addEventListener(eventName, callback);
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
const pageTitle = getElement("pageTitle");
const sidebar = getElement("sidebar");

function showPage(pageId) {
  const targetPage = getElement(pageId);

  if (!targetPage) {
    console.error("Page not found:", pageId);
    return;
  }

  // Hide all pages.
  pages.forEach(page => {
    page.classList.remove("active-page");
  });

  // Display selected page.
  targetPage.classList.add("active-page");

  // Update active navigation links.
  navLinks.forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.page === pageId
    );
  });

  // Update page heading.
  if (pageTitle) {
    const activeLink = document.querySelector(
      `.nav-link[data-page="${pageId}"]`
    );

    pageTitle.textContent = activeLink
      ? activeLink.textContent.trim()
      : pageId.charAt(0).toUpperCase() + pageId.slice(1);
  }

  // Close mobile sidebar.
  if (sidebar) {
    sidebar.classList.remove("open");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Desktop and mobile navigation.
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
// 6. MOBILE SIDEBAR
// ======================================================

addSafeListener(
  getElement("menuToggle"),
  "click",
  () => {
    if (sidebar) {
      sidebar.classList.toggle("open");
    }
  }
);

// ======================================================
// 7. NOTIFICATION BUTTON
// ======================================================

addSafeListener(
  document.querySelector(".notification-button"),
  "click",
  () => {
    showToast("You have no new notifications.");
  }
);

// ======================================================
// 8. LIGHT AND DARK THEME
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
  const isCurrentlyLight =
    document.body.classList.contains("light-theme");

  const newTheme = isCurrentlyLight ? "dark" : "light";

  applyTheme(newTheme);

  localStorage.setItem("credoTheme", newTheme);
});

const savedTheme = localStorage.getItem("credoTheme");

if (savedTheme === "light") {
  applyTheme("light");
}

// ======================================================
// 9. TRANSACTION DATA
// ======================================================

// Temporary demonstration records.
// Real customer transactions will be loaded from Supabase
// after authentication and transaction integration.

let transactions = [
  {
    type: "Airtime",
    phone: "0712 *** 456",
    amount: 100,
    date: "Today",
    status: "Successful"
  },
  {
    type: "Data Bundle",
    phone: "0722 *** 789",
    amount: 250,
    date: "Yesterday",
    status: "Successful"
  },
  {
    type: "Airtime",
    phone: "0733 *** 123",
    amount: 50,
    date: "Yesterday",
    status: "Pending"
  }
];

// ======================================================
// 10. PHONE NUMBER HELPERS
// ======================================================

function normalizePhone(phone) {
  let number = String(phone || "")
    .replace(/\s+/g, "")
    .replace(/-/g, "");

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
// 11. TRANSACTION DISPLAY
// ======================================================

function renderTransactions() {
  const recentContainer = getElement("recentTransactions");
  const allContainer = getElement("allTransactions");

  const rows = transactions.map(transaction => {
    const statusClass =
      transaction.status === "Successful"
        ? "success"
        : "pending";

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
    recentContainer.innerHTML = rows
      ? rows
      : "<tr><td colspan='5'>No transactions yet.</td></tr>";
  }

  if (allContainer) {
    allContainer.innerHTML = rows
      ? rows
      : "<tr><td colspan='5'>No transactions yet.</td></tr>";
  }

  // Calculate transaction statistics.
  const successful = transactions.filter(
    transaction => transaction.status === "Successful"
  );

  const pending = transactions.filter(
    transaction => transaction.status === "Pending"
  );

  const totalSpent = successful.reduce(
    (total, transaction) =>
      total + Number(transaction.amount),
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
// 12. ADD TRANSACTION
// ======================================================

function addTransaction(type, phone, amount) {
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
// 13. AIRTIME PURCHASE FORM
// ======================================================

addSafeListener(
  getElement("airtimeForm"),
  "submit",
  event => {
    event.preventDefault();

    const phone = normalizePhone(
      getElement("airtimePhone").value
    );

    const network = getElement("airtimeNetwork").value;

    const amount = Number(
      getElement("airtimeAmount").value
    );

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

    addTransaction("Airtime - " + network, phone, amount);

    showToast(
      "Demo airtime request recorded. No payment was made."
    );

    event.target.reset();

    showPage("transactions");
  }
);

// ======================================================
// 14. DATA BUNDLE PURCHASE FORM
// ======================================================

addSafeListener(
  getElement("bundleForm"),
  "submit",
  event => {
    event.preventDefault();

    const phone = normalizePhone(
      getElement("bundlePhone").value
    );

    const network = getElement("bundleNetwork").value;

    const amount = Number(
      getElement("bundleChoice").value
    );

    if (!validKenyanPhone(phone)) {
      showToast("Please enter a valid Kenyan phone number.");
      return;
    }

    if (!network || !Number.isFinite(amount) || amount <= 0) {
      showToast("Please select a network and bundle.");
      return;
    }

    addTransaction("Data Bundle - " + network, phone, amount);

    showToast(
      "Demo bundle request recorded. No payment was made."
    );

    event.target.reset();

    showPage("transactions");
  }
);

// ======================================================
// 15. BULK AIRTIME TOP-UP
// ======================================================

addSafeListener(
  getElement("bulkForm"),
  "submit",
  event => {
    event.preventDefault();

    const numbers = getElement("bulkNumbers").value
      .split("\n")
      .map(number => normalizePhone(number.trim()))
      .filter(Boolean);

    const amount = Number(
      getElement("bulkAmount").value
    );

    if (!numbers.length) {
      showToast("Enter at least one phone number.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
      showToast("Enter a valid amount between KES 10 and KES 10,000.");
      return;
    }

    const invalidNumbers = numbers.filter(
      number => !validKenyanPhone(number)
    );

    if (invalidNumbers.length > 0) {
      showToast(
        "Some phone numbers are invalid. Please check your list."
      );
      return;
    }

    numbers.forEach(number => {
      addTransaction("Bulk Airtime", number, amount);
    });

    showToast(
      numbers.length + " demo top-up requests recorded."
    );

    event.target.reset();

    showPage("transactions");
  }
);

// ======================================================
// 16. SCHEDULED TOP-UPS
// ======================================================

const scheduleDate = getElement("scheduleDate");

function getLocalDateString() {
  const today = new Date();

  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().split("T")[0];
}

const localToday = getLocalDateString();

if (scheduleDate) {
  scheduleDate.min = localToday;
}

addSafeListener(
  getElement("scheduleForm"),
  "submit",
  event => {
    event.preventDefault();

    const phone = normalizePhone(
      getElement("schedulePhone").value
    );

    const amount = Number(
      getElement("scheduleAmount").value
    );

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

    showToast(
      "Demo schedule saved for " + date + "."
    );

    event.target.reset();

    if (scheduleDate) {
      scheduleDate.min = getLocalDateString();
    }
  }
);


// ======================================================
// 17. CUSTOMER ACCOUNT PROFILE
// ======================================================

// Load the signed-in customer's profile.

async function loadCustomerProfile() {
  if (!window.db) {
    showToast("Database connection unavailable.");
    return;
  }

  try {
    const { data: userData, error: userError } =
      await window.db.auth.getUser();

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

    if (error) throw error;

    getElement("profileFullName").value =
      profile.full_name || user.user_metadata?.full_name || "";

    getElement("profileEmail").value = user.email || "";

    getElement("profilePhone").value =
      profile.phone || user.user_metadata?.phone || "";

    console.log("Customer profile loaded successfully.");

  } catch (error) {
    console.error("Profile loading error:", error);
    showToast("Unable to load your profile.");
  }
}

// Save changes to the customer's profile.

addSafeListener(
  getElement("saveAccount"),
  "click",
  async () => {
    if (!window.db) {
      showToast("Database connection unavailable.");
      return;
    }

    const fullName = getElement("profileFullName").value.trim();

    const phone = normalizePhone(
      getElement("profilePhone").value
    );

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
      const { data: userData, error: userError } =
        await window.db.auth.getUser();

      if (userError) throw userError;

      const user = userData.user;

      if (!user) {
        showPage("auth");
        return;
      }

      const { error } = await window.db
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone
        })
        .eq("id", user.id);

      if (error) throw error;

      showToast("Your profile has been updated!");

      console.log("Customer profile updated successfully.");

    } catch (error) {
      console.error("Profile saving error:", error);
      showToast(error.message || "Unable to save profile.");

    } finally {
      button.disabled = false;
      button.textContent = "Save Changes";
    }
  }
);




// ======================================================
// 18. SUPABASE CONNECTION TEST HELPER
// ======================================================

// This function can be called from the browser console.
// It checks whether the app can communicate with Supabase.

async function testDatabaseConnection() {
  if (!window.db) {
    console.error("Database client is not initialized.");
    return;
  }

  try {
    const { data, error } = await window.db
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Database test failed:", error);
      return;
    }

    console.log("Database connection successful!", data);

  } catch (error) {
    console.error("Unexpected database error:", error);
  }
}

// ======================================================
// 19. SERVICE WORKER / PWA REGISTRATION
// ======================================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(registration => {
        console.log(
          "CredoConnect service worker activated:",
          registration.scope
        );
      })
      .catch(error => {
        console.error(
          "Service worker registration failed:",
          error
        );
      });
  });
}

// ======================================================
// 19B. CUSTOMER REGISTRATION AND LOGIN
// ======================================================

// Switch between Login and Registration forms.

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

// Customer registration.

addSafeListener(
  getElement("authSignupForm"),
  "submit",
  async event => {
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
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        showToast("Account created successfully!");

        event.target.reset();

        showPage("dashboard");
      } else {
        showToast(
          "Account created! Check your email to verify your account."
        );
      }

    } catch (error) {
      console.error("Registration error:", error);
      showToast(error.message || "Registration failed.");

    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }
);

// Customer login.

addSafeListener(
  getElement("authLoginForm"),
  "submit",
  async event => {
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
      const { data, error } = await window.db.auth.signInWithPassword({
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
  }
);

// Check whether a customer is already signed in.

async function checkCustomerSession() {
  if (!window.db) {
    showPage("auth");
    showToast("Unable to connect to the database.");
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
// 20. INITIAL APPLICATION STARTUP
// ======================================================

// All data variables and functions are now defined before
// the initial dashboard rendering takes place.

renderTransactions();

console.log("CredoConnect loaded successfully.");



