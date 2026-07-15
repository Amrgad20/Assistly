import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConversationList } from '../../../admin/pages/conversations/components/conversation-list/conversation-list';

@Component({
  selector: 'app-conversation-history',
  standalone: true,
  imports: [
    CommonModule,
    ConversationList
  ],
  templateUrl: './conversation-history.html',
  styleUrl: './conversation-history.scss'
})
export class ConversationHistory {

}