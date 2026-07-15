import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConversationList } from '../../../admin/pages/conversations/components/conversation-list/conversation-list';
import { CustomerChatWindow } from './components/customer-chat-window/customer-chat-window';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ConversationList,
    CustomerChatWindow
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class Chat {

}