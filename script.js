// script.js

// DOM element selection
const emailInput = document.getElementById("emailInput");
emailInput.setAttribute("autocomplete", "off"); // Disable password manager support
const suggestions = document.getElementById("suggestions");
const continueButton = document.getElementById("continueButton");
const modal = document.getElementById("modal");
const correctEmailBtn = document.getElementById("correctEmail");
const keepOriginalBtn = document.getElementById("keepOriginal");
const closeBtn = document.querySelector(".close");
const errorMessage = document.getElementById("errorMessage");
const inputContainer = document.querySelector(".input-container");

// Constants
const domains = [
  "gmail.com",
  "web.de",
  "gmx.de",
  "icloud.com",
  "gmx.com",
  "gmx.net",
  "outlook.com",
  "outlook.de",
  "yahoo.com",
  "hotmail.co.uk",
  "googlemail.com",
];
const validTLDs = [
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "io",
  "co",
  "us",
  "uk",
  "de",
  "fr",
  "jp",
  "au",
  "ru",
  "in",
  "ca",
  "it",
  "es",
  "nl",
  "br",
  "se",
  "no",
  "fi",
  "dk",
  "ch",
  "at",
  "be",
  "nz",
  "ie",
  "sg",
  "hk",
  "tw",
  "kr",
  "pl",
  "hu",
  "cz",
  "gr",
  "pt",
  "il",
  "za",
  "mx",
  "ar",
  "cl",
  "co",
  "pe",
  "ve",
  "ua",
  "th",
  "vn",
  "id",
];
let selectedIndex = -1;
let lastMatchingDomains = [];

// Email validation function
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Find the closest matching domain
function findClosestDomain(inputDomain) {
  let closestDomain = null;
  let minDistance = Infinity;

  for (const domain of domains) {
    const distance = levenshteinDistance(
      inputDomain.toLowerCase(),
      domain.toLowerCase()
    );

    if (distance < minDistance && distance <= 2) {
      // Changed from 1 to 2
      minDistance = distance;
      closestDomain = domain;
    }
  }

  return closestDomain;
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Function to show toast message
function showToast(message, backgroundColor = "green") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.backgroundColor = backgroundColor;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Event listener for email input
emailInput.addEventListener("input", function () {
  const inputValue = this.value;

  // Reset error state
  errorMessage.style.display = "none";
  inputContainer.classList.remove("error");

  if (inputValue.includes("@")) {
    const [username, domainPart] = inputValue.split("@");
    if (domainPart.length > 0) {
      // Ensure at least one character is typed
      const matchingDomains = domains.filter((domain) =>
        domain.startsWith(domainPart.toLowerCase())
      );

      if (matchingDomains.length > 0) {
        lastMatchingDomains = matchingDomains; // Store the last matching domains
        suggestions.innerHTML = matchingDomains
          .map((domain) => {
            const commonPart = domain.slice(0, domainPart.length);
            const completionPart = domain.slice(domainPart.length);
            return `<div class="suggestion">
                      <span class="suggestion-input">${username}@${commonPart}</span>
                      <span class="suggestion-completion"><strong>${completionPart}</strong></span>
                    </div>`;
          })
          .join("");
        suggestions.style.display = "block";
        emailInput.classList.add("suggestions-visible");
        selectedIndex = -1;
      } else if (lastMatchingDomains.length > 0) {
        // Show the last matching domains without formatting if no new matches are found
        suggestions.innerHTML = lastMatchingDomains
          .map((domain) => {
            return `<div class="suggestion">
                      <span class="suggestion-input">${username}@${domain}</span>
                    </div>`;
          })
          .join("");
        suggestions.style.display = "block";
        emailInput.classList.add("suggestions-visible");
      } else {
        suggestions.style.display = "none";
        emailInput.classList.remove("suggestions-visible");
        lastMatchingDomains = []; // Clear the last matching domains
      }
    } else {
      suggestions.style.display = "none";
      emailInput.classList.remove("suggestions-visible");
      lastMatchingDomains = []; // Clear the last matching domains
    }
  } else {
    suggestions.style.display = "none";
    emailInput.classList.remove("suggestions-visible");
    lastMatchingDomains = []; // Clear the last matching domains
  }
});

// Event listener to hide suggestions when clicking outside
document.addEventListener("click", function (event) {
  if (
    !inputContainer.contains(event.target) &&
    !suggestions.contains(event.target)
  ) {
    suggestions.style.display = "none";
    emailInput.classList.remove("suggestions-visible");
  }
});

// Event listener for suggestion clicks
suggestions.addEventListener("click", function (e) {
  const suggestionElement = e.target.closest(".suggestion");
  if (suggestionElement) {
    const inputPart =
      suggestionElement.querySelector(".suggestion-input").textContent;
    const completionPartElement = suggestionElement.querySelector(
      ".suggestion-completion"
    );
    const completionPart = completionPartElement
      ? completionPartElement.textContent
      : "";
    emailInput.value = inputPart + completionPart;
    suggestions.style.display = "none";
    emailInput.classList.remove("suggestions-visible");
  }
});

// Event listener for keyboard navigation of suggestions and email validation
emailInput.addEventListener("keydown", function (e) {
  const suggestionItems = suggestions.getElementsByClassName("suggestion");

  if (e.key === "Enter") {
    e.preventDefault();
    if (selectedIndex !== -1 && suggestionItems.length > 0) {
      const selectedSuggestion = suggestionItems[selectedIndex];
      const inputPart =
        selectedSuggestion.querySelector(".suggestion-input").textContent;
      const completionPartElement = selectedSuggestion.querySelector(
        ".suggestion-completion"
      );
      const completionPart = completionPartElement
        ? completionPartElement.textContent
        : "";
      emailInput.value = inputPart + completionPart;
      suggestions.style.display = "none";
      emailInput.classList.remove("suggestions-visible");
    }
    validateAndContinue();
    return;
  }

  if (e.key === "Escape") {
    suggestions.style.display = "none";
    emailInput.classList.remove("suggestions-visible");
    return;
  }

  if (suggestionItems.length > 0) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % suggestionItems.length;
      updateSelection(suggestionItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex =
        (selectedIndex - 1 + suggestionItems.length) % suggestionItems.length;
      updateSelection(suggestionItems);
    }
  }
});

// Global event listener for closing modal with Escape key
window.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modal.style.display === "block") {
    modal.style.display = "none";
  }
});

// Validate and continue function
function validateAndContinue() {
  const email = emailInput.value;
  const [username, domain] = email.split("@");

  if (!domain) {
    showError();
    return;
  }

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];

  if (!validTLDs.includes(tld.toLowerCase())) {
    showError();
    return;
  }

  const closestDomain = findClosestDomain(domain);
  if (
    closestDomain &&
    closestDomain !== domain.toLowerCase() &&
    domains.includes(closestDomain)
  ) {
    // Only suggest correction if the closest domain is in our predefined list
    const modalTitle = document.querySelector("#modal .modal-content h2");
    if (modalTitle) {
      modalTitle.textContent = `Did you mean "${closestDomain}"?`;
    }

    const typedEmailElement = document.getElementById("typedEmail");
    if (typedEmailElement) {
      typedEmailElement.innerHTML = `${username}@<strong>${domain}</strong>`;
    }

    modal.style.display = "block"; // Show the modal with the suggested domain
    suggestions.style.display = "none"; // Hide suggestions when modal is shown
    emailInput.classList.remove("suggestions-visible"); // Remove suggestions-visible class
    return; // Exit the function to prevent further execution
  } else if (!validateEmail(email)) {
    showError();
  } else if (!domains.includes(domain.toLowerCase())) {
    // Valid email with a domain not in our list
    console.log("Continuing with:", email);
    showToast(
      `${domain} might be a valid domain but not 100% certain`,
      "orange"
    );
  } else {
    // Valid email with a domain in our list
    console.log("Continuing with:", email);
    showToast("Continuing with valid email: " + email);
  }
}

// Update the visual selection of suggestions
function updateSelection(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle("selected", i === selectedIndex);
  }
}

// Event listener for continue button
continueButton.addEventListener("click", validateAndContinue);

// Show error message
function showError() {
  errorMessage.style.display = "flex";
  inputContainer.classList.add("error");
  suggestions.style.display = "none"; // Hide suggestions when error is shown
  emailInput.classList.remove("suggestions-visible");
}

// Hide error message
function hideError() {
  errorMessage.style.display = "none";
  inputContainer.classList.remove("error");
}

// Event listener for correcting email in modal
correctEmailBtn.addEventListener("click", function () {
  const email = emailInput.value;
  const [username, domain] = email.split("@");
  const suggestedDomain = document
    .querySelector("#modal .modal-content h2")
    .textContent.match(/"([^"]+)"/)[1]; // Extract the suggested domain
  const updatedEmail = `${username}@${suggestedDomain}`;
  emailInput.value = updatedEmail;
  modal.style.display = "none";
  hideError();
  showToast(`Continuing with valid SLD: ${suggestedDomain}`);
});

// Event listener for keeping original email in modal
keepOriginalBtn.addEventListener("click", function () {
  modal.style.display = "none";
  const originalEmail = emailInput.value;
  if (!validateEmail(originalEmail)) {
    showError();
  } else {
    hideError();
    const typedDomain = originalEmail.split("@")[1];
    showToast(
      `${typedDomain} might be a valid domain but not 100% certain`,
      "orange"
    );
  }
});

// Event listener for closing modal
closeBtn.addEventListener("click", function () {
  modal.style.display = "none";
});

// Event listener for clicking outside modal to close
window.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});
