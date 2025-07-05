import type { Ticket, TicketType } from "./interfaces/ticket";

export function injectContent() {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "getTextContent") {
      const ticketId = document.querySelector(".dtlMainCont div.dtlLIdBox");
      const ticketTitleElement = document.querySelector<HTMLTextAreaElement>(
        ".dtlCHLInpBox textarea"
      );
      const ticketType = document.querySelector(".dtlLHIdCont .dtlLHIdVal");
      const ticketDescriptionElement = document.querySelector(
        ".zseditorDisplayBody"
      ) as HTMLElement;


      const ticket: Ticket = {
        id: ticketId?.textContent?.trim() ?? "",
        title: ticketTitleElement?.textContent?.trim() ?? "",
        type: (ticketType?.textContent?.trim().toLocaleLowerCase() as TicketType) ?? "task",
        description: ticketDescriptionElement?.textContent?.trim() ?? "",
      };
      
      sendResponse(ticket);
    }
  });
}
