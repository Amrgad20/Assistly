import { Conversation } from './conversation.model';
import { SupportAgent } from './support-agent.model';
import { KnowledgeBase } from './knowledge-base.model';

export interface Workspace {

  id: string;

  name: string;

  ownerName: string;

  ownerEmail: string;

  supportAgents: SupportAgent[];

  knowledgeBase: KnowledgeBase[];

  conversations: Conversation[];

}