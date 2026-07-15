import { Injectable, signal, computed } from '@angular/core';

import { Workspace } from '../models/workspace.model';
import { Conversation } from '../models/conversation.model';

import { workspace as initialWorkspace } from '../mock-data/workspace.mock';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  private readonly _workspace = signal<Workspace>(initialWorkspace);

  readonly workspace = computed(() => this._workspace());

  readonly conversations = computed(() =>
    this._workspace().conversations
  );

  readonly supportAgents = computed(() =>
    this._workspace().supportAgents
  );

  readonly knowledgeBase = computed(() =>
    this._workspace().knowledgeBase
  );

  readonly selectedConversation =
    signal<Conversation | null>(null);

  selectConversation(conversation: Conversation) {

    this.selectedConversation.set(conversation);

  }

}