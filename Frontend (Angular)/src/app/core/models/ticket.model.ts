export type TicketStatus =
  | 'open'
  | 'pending'
  | 'resolved';

export type TicketPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface Ticket {
  id: string;
  customerId?: string;
  subject: string;
  customer: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgentId: string;

  description: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  orderNumber?: string;

  /** Used internally to prevent duplicate automatic tickets. */
  conversationId?: string;
  issueKey?: string;
}
