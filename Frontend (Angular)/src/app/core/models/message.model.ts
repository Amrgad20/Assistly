import { Attachment } from './attachment.model';

export type MessageSender =
  | 'customer'
  | 'agent'
  | 'ai';

export interface Message {

  id: string;

  sender: MessageSender;

  text: string;

  createdAt: Date;

  attachments: Attachment[];

}