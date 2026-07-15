import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConversationToolbar } from './components/conversation-toolbar/conversation-toolbar';
import { ConversationList } from './components/conversation-list/conversation-list';
import { ChatWindow } from './components/chat-window/chat-window';
import { AiInsights } from './components/ai-insights/ai-insights';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [
    CommonModule,
    ConversationToolbar,
    ConversationList,
    ChatWindow,
    AiInsights
  ],
  templateUrl: './conversations.html',
  styleUrl: './conversations.scss'
})
export class Conversations {}