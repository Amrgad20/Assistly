import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConversationList } from '../../../admin/pages/conversations/components/conversation-list/conversation-list';
import { ChatWindow } from '../../../admin/pages/conversations/components/chat-window/chat-window';
import { AiInsights } from '../../../admin/pages/conversations/components/ai-insights/ai-insights';

@Component({
  selector: 'app-live-conversations',
  standalone: true,
  imports: [
    CommonModule,
    ConversationList,
    ChatWindow,
    AiInsights
  ],
  templateUrl: './live-conversations.html',
  styleUrl: './live-conversations.scss'
})
export class LiveConversations {

}