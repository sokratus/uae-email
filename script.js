// script.js

// DOM element selection
const emailInput = document.getElementById("emailInput");
const suggestions = document.getElementById("suggestions");
const continueButton = document.getElementById("continueButton");
const modal = document.getElementById("modal");
const suggestedDomain = document.getElementById("suggestedDomain");
const correctEmailBtn = document.getElementById("correctEmail");
const keepOriginalBtn = document.getElementById("keepOriginal");
const closeBtn = document.querySelector(".close");
const errorMessage = document.getElementById("errorMessage");
const inputContainer = document.querySelector(".input-container");

// Constants
const domains = ["gmail.com", "web.de", "gmx.de", "icloud.com", "gmx.com"];
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

// Email validation function
function validateEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [, domain] = parts;
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;

  const tld = domainParts[domainParts.length - 1].toLowerCase();
  return validTLDs.includes(tld);
}

// Original findClosestDomain function
function findClosestDomain(inputDomain) {
  if (domains.includes(inputDomain.toLowerCase())) {
    return inputDomain.toLowerCase(); // Return the input domain if it's already in the list
  }

  let closestDomain = null;
  let minDistance = Infinity;

  for (const domain of domains) {
    const distance = levenshteinDistance(inputDomain.toLowerCase(), domain.toLowerCase());

    if (distance < minDistance && distance <= 1) {
      minDistance = distance;
      closestDomain = domain;
    }
  }

  return closestDomain && minDistance <= 1 ? closestDomain : null;
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
    const matchingDomains = domains.filter((domain) =>
      domain.startsWith(domainPart.toLowerCase())
    );

    if (matchingDomains.length > 0) {
      suggestions.innerHTML = matchingDomains
        .map((domain) => {
          const commonPart = domain.slice(0, domainPart.length);
          const completionPart = domain.slice(domainPart.length);
          return `<div class="suggestion">
                                <span class="suggestion-input">${username}@${commonPart}</span>
                                <span class="suggestion-completion">${completionPart}</span>
                            </div>`;
        })
        .join("");
      suggestions.style.display = "block";
      emailInput.classList.add("suggestions-visible"); // Add this line
      selectedIndex = -1;
    } else {
      suggestions.style.display = "none";
      emailInput.classList.remove("suggestions-visible"); // Add this line
    }
  } else {
    suggestions.style.display = "none";
    emailInput.classList.remove("suggestions-visible"); // Add this line
  }

  // Debugging: Log the class list to ensure the class is being toggled
  console.log(emailInput.classList);
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
    const completionPart = suggestionElement.querySelector(
      ".suggestion-completion"
    ).textContent;
    emailInput.value = inputPart + completionPart;
    suggestions.style.display = "none";
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
      const completionPart = selectedSuggestion.querySelector(
        ".suggestion-completion"
      ).textContent;
      emailInput.value = inputPart + completionPart;
      suggestions.style.display = "none";
    }
    validateAndContinue();
    return;
  }

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
});

// Original validateAndContinue function
function validateAndContinue() {
  const email = emailInput.value;
  const [username, domain] = email.split("@");

  if (!domain) {
    showError();
    return;
  }

  const closestDomain = findClosestDomain(domain);
  if (closestDomain && closestDomain !== domain) {
    suggestedDomain.textContent = closestDomain;
    modal.style.display = "block"; // Show the modal with the suggested domain
  } else if (!validateEmail(email)) {
    showError();
  } else if (!domains.includes(domain.toLowerCase())) {
    showToast(`${domain} might be a valid domain but not 100% certain`, "orange");
  } else {
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
  const updatedEmail = `${username}@${suggestedDomain.textContent}`;
  emailInput.value = updatedEmail;
  modal.style.display = "none";
  hideError();
  showToast(`Continuing with valid SLD: ${suggestedDomain.textContent}`); // Updated line
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
    showToast(`${typedDomain} might be a valid domain but not 100% certain`, "orange");
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