import { injectContent } from "./content";
import type { Ticket } from "./interfaces/ticket";
import "./style.css";


document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="container">
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

    <!--<button type="button" id="insertButton">Insert Button</button>-->
    <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        <button type="button" class="button" id="openChatGPT">Open ChatGPT</button>
        <small>Generate branch name suggestion using ChatGPT</small>
    </div>
  </div>

  <footer>
    <p class="developer">Developed with <span class="heart">❤️</span> by <strong style="font-size: 1rem;">Dionicio</strong></p>
  </footer>
`;

type TicketPrompt = {
  branchName: string;
};

const state: { ticket?: Ticket; prompt?: TicketPrompt } = {};

const openChatGPTButton = document.getElementById("openChatGPT");
const copyButton = document.getElementById("copyButton");


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
    },
    (err) => {
      console.error("Failed to copy text to clipboard:", err);
    }
  );
}
