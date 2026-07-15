import { Customer } from './customer.model';
import { Message } from './message.model';
import { Ticket } from './ticket.model';
import { CRM } from './crm.model';
import { AIAnalysis } from './ai-analysis.model';

export interface Conversation {

  id: string;

  customer: Customer;

  messages: Message[];

  ticket?: Ticket;

  crm: CRM;

  aiAnalysis: AIAnalysis;

  assignedAgentId?: string;

  status:
    | 'ai'
    | 'agent'
    | 'resolved';

}