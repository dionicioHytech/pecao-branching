import { injectContent } from "./content";
import type { Ticket } from "./interfaces/ticket";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="container">
    <!-- Tabs Navigation -->
    <div class="tabs">
      <button class="tab-button active" data-tab="main">Branch Name Generator</button>
      <button class="tab-button" data-tab="config">Configuration</button>
    </div>

    <!-- Main Tab Content -->
    <div id="main-tab" class="tab-content active">
        <div class="loading-container" id="loadingContainer" style="display: none;">
          <div class="spinner"></div>
          <span>Generating suggestions...</span>
        </div>
      <form action="#">
          <div class="form-group">
            <label for="ticketId">Ticket ID</label>
            <input type="text" id="ticketId" name="ticketId" wrap="soft">
          </div>
          <div class="form-group">
            <label for="ticketTitle">Ticket Title</label>
            <input type="text" id="ticketTitle" name="ticketTitle" wrap="soft">
          </div>
          <div class="form-group">
            <label for="ticketType">Ticket Type</label>
            <select id="ticketType" name="ticketType">
              <option value="">-- Select Type --</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
              <option value="spike">Spike</option>
              <option value="story">Story</option>
            </select>
          </div>

          <div class="form-group">
            <label for="generatedBranchName">Branch Name Suggestion</label>

            <div class="input-container">
              <input type="text" id="generatedBranchName" name="generatedBranchName" wrap="soft" autocomplete="off">
              <span class="material-symbols-outlined icon" id="copyButton" title="Copy to Clipboard">
                content_copy
              </span>
            </div>
          </div>
      </form>

      <div class="buttons-container">
          <button type="button" class="button primary" id="generateWithAI">
            <span class="button-icon">🤖</span>
            Generate with Google AI
          </button>
          <button type="button" class="button secondary" id="openChatGPT">
            <span class="button-icon">💬</span>
            Open ChatGPT
          </button>
      </div>

    </div>

    <!-- Configuration Tab Content -->
    <div id="config-tab" class="tab-content">
      <div class="config-section">
        <h3>Google AI Studio Configuration</h3>
        <div class="status-container" id="statusContainer" style="display: none;">
          <div class="status-message" id="statusMessage"></div>
        </div>
        <div class="form-group">
          <label for="googleAiToken">Google AI Studio API Token</label>
          <div class="input-container">
            <input type="password" id="googleAiToken" name="googleAiToken" placeholder="Enter your API token">
            <span class="material-symbols-outlined icon" id="toggleTokenVisibility" title="Show/Hide Token">
              visibility
            </span>
          </div>
          <small class="help-text">
            Get your token at:
            <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>
            <br>
            The token must start with "AIza" and be at least 35 characters long.
            <br>
            <strong>Note:</strong> Keep your token safe and do not share it.
          </small>
        </div>

        <div class="form-group buttons-config">
          <button type="button" class="button primary" id="saveConfig">Save Configuration</button>
          <button type="button" class="button secondary" id="testConnection">Test Connection</button>
        </div>


      </div>
    </div>
  </div>

  <footer>
    <p class="developer">Developed with <span class="heart">❤️</span> by <strong style="font-size: 1rem;">Dionicio</strong></p>
  </footer>
`;

type TicketPrompt = {
  branchName: string;
};

type GoogleAIConfig = {
  token: string;
};

const state: {
  ticket?: Ticket;
  prompt?: TicketPrompt;
  config?: GoogleAIConfig;
} = {};

// DOM Elements
const openChatGPTButton = document.getElementById("openChatGPT");
const copyButton = document.getElementById("copyButton");
const generateWithAIButton = document.getElementById("generateWithAI");
const saveConfigButton = document.getElementById("saveConfig");
const testConnectionButton = document.getElementById("testConnection");
const toggleTokenVisibilityButton = document.getElementById(
  "toggleTokenVisibility"
);
const loadingContainer = document.getElementById("loadingContainer");
const statusContainer = document.getElementById("statusContainer");

// Initialize tabs functionality
initializeTabs();

// Initialize configuration
initializeConfiguration();

if (copyButton) {
  copyButton.addEventListener("click", function () {
    const branchNameInput = document.getElementById(
      "generatedBranchName"
    ) as HTMLInputElement;

    if (branchNameInput) {
      const branchName = branchNameInput.value;
      copyToClipboard(branchName);
    }
  });
}

openChatGPTButton!.addEventListener("click", function () {
  console.log(state);

  const prompt = `Generate a git branch name for the ticket with ID: ${state.ticket?.id},
   Title: ${state.ticket?.title},
   Type: ${state.ticket?.type},
   Description: ${state.ticket?.description}.
   The generated branch name is: ${state.prompt?.branchName}.
   Give me a few suggestions for the branch name.`;

  const parameters = new URLSearchParams({
    model: "auto",
    q: prompt,
  });

  const url = `https://chatgpt.com/?${parameters.toString()}`;

  chrome.tabs.create({ url: url });
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const tabId = tabs[0].id;

  if (tabId !== undefined) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: injectContent,
    });
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const tabId = tabs[0].id;

  chrome.tabs.sendMessage(
    tabId!,
    { action: "getTextContent" },
    function (response) {
      console.log("Response from content script:", response);

      if (response) {
        state.ticket = response as Ticket;
        state.prompt = {
          branchName: generateBranchName(response),
        };

        console.log("State ticket:", state.ticket.description);

        displayTicket(response);
      }
    }
  );
});

function displayTicket(ticket: Ticket) {
  const ticketIdInput = document.getElementById("ticketId") as HTMLInputElement;
  const ticketTitleInput = document.getElementById(
    "ticketTitle"
  ) as HTMLInputElement;
  const ticketTypeInput = document.getElementById(
    "ticketType"
  ) as HTMLSelectElement;
  const branchNameInput = document.getElementById(
    "generatedBranchName"
  ) as HTMLInputElement;

  if (ticketIdInput) {
    ticketIdInput.value = ticket.id;
  }

  if (ticketTitleInput) {
    ticketTitleInput.value = ticket.title;
  }

  if (ticketTypeInput) {
    ticketTypeInput.value = ticket.type.toLowerCase();
  }

  if (branchNameInput) {
    branchNameInput.value = generateBranchName(ticket);
  }
}

const BranchPrefixes: Record<string, string> = {
  bug: "fix/",
  story: "feat/",
  task: "feat/",
  spike: "feat/",
};

function generateBranchName(ticket: Ticket) {
  const ticketId = ticket.id;
  const ticketTitle = ticket.title;
  const ticketType = ticket.type.toLowerCase();

  // Generate branch name
  let branchName = `${BranchPrefixes[ticketType]}${ticketId}`;

  if (ticketTitle) {
    const cleanedTitle = ticketTitle
      .replace(/\[[A-Za-z0-9\s_\-]+\]|\(|\)|\.|\,/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    branchName += `-${cleanedTitle}`;
  }

  return branchName;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => {
      console.log("Text copied to clipboard:", text);
      showStatusMessage("Texto copiado al portapapeles", "success");
    },
    (err) => {
      console.error("Failed to copy text to clipboard:", err);
      showStatusMessage("Error al copiar texto", "error");
    }
  );
}

// Tabs functionality
function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      const targetContent = document.getElementById(`${tabId}-tab`);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });
}

// Configuration functionality
function initializeConfiguration() {
  loadConfiguration();

  if (saveConfigButton) {
    saveConfigButton.addEventListener("click", () => {
      saveConfiguration();
    });
  }

  function saveConfiguration() {
    const tokenInput = document.getElementById(
      "googleAiToken"
    ) as HTMLInputElement;
    if (!tokenInput || !tokenInput.value.trim()) {
      showStatusMessage("Please enter a valid token", "error");
    } else {
      const token = tokenInput.value.trim();
      if (!token.startsWith("AIza") || token.length < 35) {
        showStatusMessage(
          'The token format is invalid. It must start with "AIza" and be at least 35 characters long.',
          "error"
        );
      } else {
        const config: GoogleAIConfig = { token };
        chrome.storage.sync.set({ googleAiConfig: config }, () => {
          state.config = config;
          showStatusMessage("Configuration saved successfully", "success");
        });
      }
    }
  }

  if (testConnectionButton) {
    testConnectionButton.addEventListener("click", testGoogleAIConnection);
  }

  if (toggleTokenVisibilityButton) {
    toggleTokenVisibilityButton.addEventListener(
      "click",
      toggleTokenVisibility
    );
  }

  if (generateWithAIButton) {
    generateWithAIButton.addEventListener("click", generateBranchNamesWithAI);
  }
}

function loadConfiguration() {
  chrome.storage.sync.get(["googleAiConfig"], (result) => {
    if (result.googleAiConfig) {
      state.config = result.googleAiConfig;
      const tokenInput = document.getElementById(
        "googleAiToken"
      ) as HTMLInputElement;
      if (tokenInput && state.config?.token) {
        tokenInput.value = state.config.token;
      }
    }
  });
}

async function testGoogleAIConnection() {
  if (!state.config?.token) {
    showStatusMessage("Please save the configuration first", "error");
    return;
  }

  showLoading(true);

  try {
    // Test with a simple request to verify the API key works
    const testRequestBody = {
      contents: [
        {
          parts: [
            {
              text: "Hello, this is a test.",
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${state.config.token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testRequestBody),
      }
    );

    if (response.ok) {
      showStatusMessage(
        "Successfully connected to Google AI Studio",
        "success"
      );
    } else {
      const errorData = await response.text();
      console.error("API Error:", errorData);
      showStatusMessage(
        `Error connecting to Google AI Studio. Status: ${response.status}. Check your token.`,
        "error"
      );
    }
  } catch (error) {
    console.error("Connection error:", error);
    showStatusMessage(
      "Connection error. Check your internet connection.",
      "error"
    );
  } finally {
    showLoading(false);
  }
}

function toggleTokenVisibility() {
  const tokenInput = document.getElementById(
    "googleAiToken"
  ) as HTMLInputElement;
  const toggleButton = document.getElementById("toggleTokenVisibility");

  if (tokenInput && toggleButton) {
    if (tokenInput.type === "password") {
      tokenInput.type = "text";
      toggleButton.textContent = "visibility_off";
    } else {
      tokenInput.type = "password";
      toggleButton.textContent = "visibility";
    }
  }
}

async function generateBranchNamesWithAI() {
  if (!state.config?.token) {
    showStatusMessage(
      "Please configure your Google AI Studio token first",
      "error"
    );
    return;
  }

  if (!state.ticket) {
    showStatusMessage("No ticket information available", "error");
    return;
  }

  showLoading(true);

  try {
    const prompt = `You are a Git and software development expert. Generate 3 different branch names for the following ticket:\n\nID: ${state.ticket.id}\nTitle: ${state.ticket.title}\nType: ${state.ticket.type}\nDescription: ${state.ticket.description}\n\nFollow these conventions:\n- For bugs: use the prefix \"fix/\"\n- For features/stories/tasks: use the prefix \"feat/\"\n- For spikes: use the prefix \"feat/\"\n- Use the ticket ID\n- Simplify and clean the title by removing special characters\n- Use hyphens to separate words\n- Keep names concise but descriptive\n- All lowercase\n\nRespond ONLY with the 3 branch names, one per line, with no additional explanations.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${state.config.token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("API Error Response:", errorData);
      throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts[0].text;
      const suggestions = generatedText
        .trim()
        .split("\n")
        .filter((line: string) => line.trim());

      if (suggestions.length > 0) {
        // Use the first suggestion as the main branch name
        const branchNameInput = document.getElementById(
          "generatedBranchName"
        ) as HTMLInputElement;
        if (branchNameInput) {
          branchNameInput.value = suggestions[0].trim();
        }

        // Show all suggestions in a more user-friendly way
        const suggestionText = suggestions
          .map((s: string, i: number) => `${i + 1}. ${s.trim()}`)
          .join("\n");
        showStatusMessage(
          `Generated suggestions:\n${suggestionText}`,
          "success"
        );

        // Update state
        state.prompt = {
          branchName: suggestions[0].trim(),
        };
      } else {
        showStatusMessage("Could not generate valid suggestions", "error");
      }
    } else {
      showStatusMessage("Invalid API response", "error");
    }
  } catch (error) {
    console.error("Error generating branch names:", error);
    showStatusMessage(
      "Error generating suggestions. Check your configuration.",
      "error"
    );
  } finally {
    showLoading(false);
  }
}

function showLoading(show: boolean) {
  if (loadingContainer) {
    loadingContainer.style.display = show ? "flex" : "none";
  }
}

function showStatusMessage(message: string, type: "success" | "error") {
  const statusMessage = document.getElementById("statusMessage");

  if (statusContainer && statusMessage) {
    statusMessage.textContent = message;
    statusContainer.className = `status-container ${type}`;
    statusContainer.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusContainer.style.display = "none";
    }, 5000);
  }
}
