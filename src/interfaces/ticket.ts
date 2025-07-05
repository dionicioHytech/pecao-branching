const TicketType = {
  Bug: "bug",
  Task: "task",
  Spike: "spike",
  Story: "story",
} as const;

export type TicketType = typeof TicketType[keyof typeof TicketType];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
}
