import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Conversation } from '../../../../../../core/models/conversation.model';
import { MockDataService } from '../../../../../../core/services/mock-data.service';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './conversation-list.html',
  styleUrl: './conversation-list.scss'
})
export class ConversationList {

  constructor(
    public mockData: MockDataService
  ) {}

  select(conversation: Conversation) {

    this.mockData.selectConversation(conversation);

  }

}