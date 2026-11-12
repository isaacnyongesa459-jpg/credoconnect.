
// ========================================
// CREDOCONNECT - MAIN JAVASCRIPT
// ========================================

// ========================================
// SUPABASE DATABASE CONNECTION
// ========================================

const SUPABASE_URL = "https://euwsybgjtuwtzgivugan.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_3QmVGhPnif-L8DpzWLcb4g_82dCyNj6";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("CredoConnect Supabase connection initialized.");

// Navigation between pages

const navLinks = document.querySelectorAll(
  ".nav-link, .mobile-nav-link"
);

const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");

function showPage(pageId) {

  const targetPage = document.getElementById(pageId);

  if (!targetPage) {
    console.error("Page not found:", pageId);
    return;
  }

  // Hide all pages
  pages.forEach(page => {
    page.classList.remove("active-page");
  });

  // Show selected page
  targetPage.classList.add("active-page");

  // Update active navigation buttons
  navLinks.forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.page === pageId
    );
  });

  // Update page heading
  if (pageTitle) {
    const activeLink = document.querySelector(
      `.nav-link[data-page="${pageId}"]`
    );

    pageTitle.textContent = activeLink
      ? activeLink.textContent.trim()
      : pageId.charAt(0).toUpperCase() + pageId.slice(1);
  }

  // Close mobile sidebar
  if (sidebar) {
    sidebar.classList.remove("open");
  }

  // Return to top
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Handle desktop and mobile navigation
navLinks.forEach(link => {

  link.addEventListener("click", function(event) {

    event.preventDefault();

    const pageId = this.dataset.page;

    if (pageId) {
      showPage(pageId);
    }

  });

});
// Quick action buttons

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {

    // Open the requested page
    showPage(button.dataset.go);

    // Automatically select the network when a network button is clicked
    if (button.dataset.network) {
      const airtimeNetwork = document.getElementById("airtimeNetwork");

      if (airtimeNetwork) {
        airtimeNetwork.value = button.dataset.network;
      }
    }

  });
});

// Mobile sidebar
document.getElementById("menuToggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ========================================
// NOTIFICATIONS
// ========================================

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

document.querySelector(".notification-button").addEventListener("click", () => {
  showToast("You have no new notifications.");
});

// ========================================
// LIGHT AND DARK THEME
// ========================================

const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");

  const isLight = document.body.classList.contains("light-theme");

  themeToggle.textContent = isLight ? "☀" : "☾";

  localStorage.setItem("credoTheme", isLight ? "light" : "dark");
});

const savedTheme = localStorage.getItem("credoTheme");

if (savedTheme === "light") {
  document.body.classList.add("light-theme");
  themeToggle.textContent = "☀";
}

// ========================================
// TRANSACTION DATA
// ========================================

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

function maskPhone(phone) {
  return phone.slice(0, 4) + " *** " + phone.slice(-3);
}

function renderTransactions() {
  const recentContainer = document.getElementById("recentTransactions");
  const allContainer = document.getElementById("allTransactions");

  const rows = transactions.map(transaction => {
    const statusClass =
      transaction.status === "Successful" ? "success" : "pending";

    return `
      <tr>
        <td>${transaction.type}</td>
        <td>${transaction.phone}</td>
        <td>KES ${transaction.amount.toLocaleString("en-KE")}</td>
        <td>${transaction.date}</td>
        <td>
          <span class="status ${statusClass}">
            ${transaction.status}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  recentContainer.innerHTML = rows.slice(0, 3);
  allContainer.innerHTML = rows;

  const successful = transactions.filter(
    transaction => transaction.status === "Successful"
  );

  const pending = transactions.filter(
    transaction => transaction.status === "Pending"
  );

  const totalSpent = successful.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  document.getElementById("totalTransactions").textContent =
    transactions.length;

  document.getElementById("successfulTransactions").textContent =
    successful.length;

  document.getElementById("pendingTransactions").textContent =
    pending.length;

  document.getElementById("totalSpent").textContent =
    "KES " + totalSpent.toLocaleString("en-KE");
}

function addTransaction(type, phone, amount) {
  transactions.unshift({
    type,
    phone: maskPhone(phone),
    amount,
    date: new Date().toLocaleDateString("en-KE"),
    status: "Pending"
  });

  renderTransactions();
}

// ========================================
// PHONE NUMBER VALIDATION
// ========================================

function normalizePhone(phone) {
  let number = phone.replace(/\s+/g, "").replace(/-/g, "");

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

// ========================================
// AIRTIME PURCHASE
// ========================================

document.getElementById("airtimeForm").addEventListener("submit", event => {
  event.preventDefault();

  const phone = normalizePhone(
    document.getElementById("airtimePhone").value
  );

  const network = document.getElementById("airtimeNetwork").value;

  const amount = Number(
    document.getElementById("airtimeAmount").value
  );

  if (!validKenyanPhone(phone)) {
    showToast("Please enter a valid Kenyan phone number.");
    return;
  }

  if (!network) {
    showToast("Please select a network.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 10) {
    showToast("Minimum airtime amount is KES 10.");
    return;
  }

  addTransaction("Airtime - " + network, phone, amount);

  showToast("Demo airtime request recorded. No payment was made.");

  event.target.reset();
  showPage("transactions");
});

// ========================================
// DATA BUNDLE PURCHASE
// ========================================

document.getElementById("bundleForm").addEventListener("submit", event => {
  event.preventDefault();

  const phone = normalizePhone(
    document.getElementById("bundlePhone").value
  );

  const network = document.getElementById("bundleNetwork").value;

  const amount = Number(
    document.getElementById("bundleChoice").value
  );

  if (!validKenyanPhone(phone)) {
    showToast("Please enter a valid Kenyan phone number.");
    return;
  }

  if (!network || !amount) {
    showToast("Please select a network and bundle.");
    return;
  }

  addTransaction("Data Bundle - " + network, phone, amount);

  showToast("Demo bundle request recorded. No payment was made.");

  event.target.reset();
  showPage("transactions");
});

// ========================================
// BULK TOP-UP
// ========================================

document.getElementById("bulkForm").addEventListener("submit", event => {
  event.preventDefault();

  const numbers = document.getElementById("bulkNumbers").value
    .split("\n")
    .map(number => normalizePhone(number.trim()))
    .filter(Boolean);

  const amount = Number(
    document.getElementById("bulkAmount").value
  );

  if (!numbers.length) {
    showToast("Enter at least one phone number.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 10) {
    showToast("Enter a valid amount of at least KES 10.");
    return;
  }

  const invalidNumbers = numbers.filter(
    number => !validKenyanPhone(number)
  );

  if (invalidNumbers.length) {
    showToast("Some phone numbers are invalid. Check your list.");
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
});

// ========================================
// SCHEDULED TOP-UPS
// ========================================

const scheduleDate = document.getElementById("scheduleDate");

const today = new Date();
const localToday = new Date(
  today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

scheduleDate.min = localToday;

document.getElementById("scheduleForm").addEventListener("submit", event => {
  event.preventDefault();

  const phone = normalizePhone(
    document.getElementById("schedulePhone").value
  );

  const amount = Number(
    document.getElementById("scheduleAmount").value
  );

  const date = scheduleDate.value;

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

  showToast("Demo schedule saved for " + date + ".");

  event.target.reset();
  scheduleDate.min = localToday;
});

// ========================================
// ACCOUNT SETTINGS
// ========================================

document.getElementById("saveAccount").addEventListener("click", () => {
  showToast("Demo profile changes saved.");
});

// ========================================
// FAVOURITES
// ========================================

// Initial dashboard rendering
renderTransactions();

console.log("CredoConnect loaded successfully.");

// ========================================
// CREDOCONNECT APP - SERVICE WORKER
// ========================================

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

