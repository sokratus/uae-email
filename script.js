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

// Find the closest matching domain
function findClosestDomain(inputDomain) {
  let closestDomain = null;
  let minDistance = Infinity;

  // Split the input domain into SLD and TLD
  const [inputSLD, inputTLD] = inputDomain.split(".");

  for (const domain of domains) {
    // Split each known domain into SLD and TLD
    const [knownSLD, knownTLD] = domain.split(".");

    // Calculate distance based on SLD only
    const distance = levenshteinDistance(
      inputSLD.toLowerCase(),
      knownSLD.toLowerCase()
    );

    // We're being more strict here. Only suggest if it's very close to a known domain.
    if (distance < minDistance && distance <= 1) {
      minDistance = distance;
      closestDomain = domain;
    }
  }

  // Only return a suggestion if it's very close to a known domain
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
      selectedIndex = -1;
    } else {
      suggestions.style.display = "none";
    }
  } else {
    suggestions.style.display = "none";
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

// Event listener for keyboard navigation of suggestions
emailInput.addEventListener("keydown", function (e) {
  const suggestionItems = suggestions.getElementsByClassName("suggestion");
  if (suggestionItems.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % suggestionItems.length;
    updateSelection(suggestionItems);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex =
      (selectedIndex - 1 + suggestionItems.length) % suggestionItems.length;
    updateSelection(suggestionItems);
  } else if (e.key === "Enter" && selectedIndex !== -1) {
    e.preventDefault();
    const selectedSuggestion = suggestionItems[selectedIndex];
    const inputPart =
      selectedSuggestion.querySelector(".suggestion-input").textContent;
    const completionPart = selectedSuggestion.querySelector(
      ".suggestion-completion"
    ).textContent;
    emailInput.value = inputPart + completionPart;
    suggestions.style.display = "none";
  }
});

// Update the visual selection of suggestions
function updateSelection(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle("selected", i === selectedIndex);
  }
}

// Event listener for continue button
continueButton.addEventListener("click", function () {
  const email = emailInput.value;
  const [username, domain] = email.split("@");

  if (!domain) {
    showError();
    return;
  }

  const closestDomain = findClosestDomain(domain);
  if (closestDomain && closestDomain !== domain) {
    suggestedDomain.textContent = closestDomain;
    modal.style.display = "block";
  } else if (!validateEmail(email)) {
    showError();
  } else {
    console.log("Continuing with:", email);
  }
});

// Show error message
function showError() {
  errorMessage.style.display = "block";
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
  const [username, _] = email.split("@");
  emailInput.value = `${username}@${suggestedDomain.textContent}`;
  modal.style.display = "none";
  hideError();
});

// Event listener for keeping original email in modal
keepOriginalBtn.addEventListener("click", function () {
  modal.style.display = "none";
  if (!validateEmail(emailInput.value)) {
    showError();
  } else {
    hideError();
    console.log("Continuing with:", emailInput.value);
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
