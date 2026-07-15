import {
  inject,
  Injectable,
  signal
} from '@angular/core';

import { Conversation } from '../models/conversation.model';
import { Workspace } from '../models/workspace.model';
import { ConversationService } from './conversation.service';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

import {
  workspace as initialWorkspace
} from '../mock-data/workspace.mock';

interface ConversationSyncMessage {
  type: 'conversation-updated';
  conversation: Conversation;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  private readonly auth = inject(
    AuthService
  );

  private readonly storageKeyPrefix =
    'assistlySavedConversations';

  private readonly channelName =
    'assistly-conversations';

  private readonly channel:
    BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(
          this.channelName
        )
      : null;

  workspace = signal<Workspace>(
    this.createWorkspace()
  );

  selectedConversation =
    signal<Conversation | null>(
      this.workspace()
        .conversations[0] ??
      null
    );

  constructor(
    private conversationService:
      ConversationService
  ) {

    this.listenForBroadcastUpdates();

    this.listenForStorageUpdates();

    window.addEventListener(
      'assistly-auth-changed',
      () => {
        const workspace =
          this.createWorkspace();

        this.workspace.set(
          workspace
        );

        this.selectedConversation.set(
          workspace.conversations[0] ??
          null
        );

        void this.loadBackendConversations();
      }
    );

    void this.loadBackendConversations();

  }

  private async loadBackendConversations():
    Promise<void> {

    const conversations =
      await this.conversationService
        .listBackendConversations();

    if (conversations === null) {
      return;
    }

    const authorized = conversations
      .filter(conversation =>
        this.canCurrentUserAccess(
          conversation
        )
      )
      .map(conversation =>
        this.normalizeConversation(
          conversation
        )
      );

    const currentUser =
      this.auth.getCurrentUser();

    if (
      currentUser?.role === 'customer' &&
      authorized.length === 0
    ) {
      authorized.push(
        this.createCustomerConversation(
          currentUser
        )
      );
    }

    this.workspace.update(
      workspace => ({
        ...workspace,
        conversations: authorized
      })
    );

    this.selectedConversation.set(
      authorized[0] ?? null
    );

  }

  getConversations():
    Conversation[] {

    return (
      this.workspace()
        .conversations
        .filter(conversation =>
          this.canCurrentUserAccess(
            conversation
          )
        )
    );

  }

  selectConversation(
    conversation: Conversation
  ): void {

    this.selectedConversation.set(
      conversation
    );

  }

  private listenForBroadcastUpdates():
    void {

    if (!this.channel) return;

    this.channel.onmessage = (
      event:
        MessageEvent<ConversationSyncMessage>
    ) => {

      const message =
        event.data;

      if (
        message.type !==
        'conversation-updated'
      ) {
        return;
      }

      this.applyConversationUpdate(
        message.conversation
      );

    };

  }

  private listenForStorageUpdates():
    void {

    window.addEventListener(
      'storage',
      event => {

        if (
          event.key !==
          this.storageKey
        ) {
          return;
        }

        const saved =
          this.getSavedConversations();

        Object.values(saved)
          .forEach(conversation => {

            this.applyConversationUpdate(
              conversation
            );

          });

      }
    );

  }

  private applyConversationUpdate(
    incomingConversation: Conversation
  ): void {

    const normalizedConversation =
      this.normalizeConversation(
        incomingConversation
      );

    if (
      !this.canCurrentUserAccess(
        normalizedConversation
      )
    ) {
      return;
    }

    const currentWorkspace =
      this.workspace();

    const conversationExists =
      currentWorkspace.conversations
        .some(item =>
          item.id ===
          normalizedConversation.id
        );

    const conversations =
      conversationExists
        ? currentWorkspace.conversations
            .map(item =>
              item.id ===
              normalizedConversation.id
                ? normalizedConversation
                : item
            )
        : [
            ...currentWorkspace.conversations,
            normalizedConversation
          ];

    this.workspace.set({
      ...currentWorkspace,
      conversations
    });

    const selected =
      this.selectedConversation();

    if (
      selected?.id ===
      normalizedConversation.id
    ) {

      this.selectedConversation.set(
        normalizedConversation
      );

    }

  }

  private createWorkspace():
    Workspace {

    const clonedWorkspace =
      structuredClone(
        initialWorkspace
      );

    const currentUser =
      this.auth.getCurrentUser();

    if (!currentUser) {
      clonedWorkspace.conversations = [];
      return clonedWorkspace;
    }

    const saved =
      this.getSavedConversations();

    let conversations =
      clonedWorkspace.conversations
        .filter(conversation =>
          this.canCurrentUserAccess(
            conversation
          )
        )
        .map(conversation =>
          this.normalizeConversation(
            conversation
          )
        );

    Object.values(saved)
      .filter(conversation =>
        this.canCurrentUserAccess(
          conversation
        )
      )
      .forEach(conversation => {
        const normalized =
          this.normalizeConversation(
            conversation
          );
        const index =
          conversations.findIndex(
            item => item.id === normalized.id
          );

        if (index >= 0) {
          conversations[index] = normalized;
        } else {
          conversations.push(normalized);
        }
      });

    if (
      currentUser.role === 'customer' &&
      conversations.length === 0
    ) {
      conversations = [
        this.createCustomerConversation(
          currentUser
        )
      ];
    }

    clonedWorkspace.conversations =
      conversations;

    return clonedWorkspace;

  }

  private normalizeConversation(
    conversation: Conversation
  ): Conversation {

    return {
      ...conversation,

      messages:
        conversation.messages.map(
          message => ({
            ...message,
            createdAt:
              new Date(
                message.createdAt
              ),
            attachments:
              message.attachments ?? []
          })
        )
    };

  }

  private getSavedConversations():
    Record<string, Conversation> {

    const raw =
      localStorage.getItem(
        this.storageKey
      );

    if (!raw) {
      return {};
    }

    try {

      return JSON.parse(raw) as
        Record<string, Conversation>;

    } catch {

      localStorage.removeItem(
        this.storageKey
      );

      return {};

    }

  }

  private get storageKey(): string {

    const userId =
      this.auth.getCurrentUser()?.id ??
      'anonymous';

    return (
      `${this.storageKeyPrefix}:` +
      userId
    );

  }

  private canCurrentUserAccess(
    conversation: Conversation
  ): boolean {

    const user =
      this.auth.getCurrentUser();

    if (!user) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    if (user.role === 'agent') {
      return (
        conversation.assignedAgentId ===
        user.id
      );
    }

    return (
      conversation.customer.id ===
      user.id
    );

  }

  private createCustomerConversation(
    user: User
  ): Conversation {

    return {
      id: `conversation-${user.id}`,
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: ''
      },
      messages: [],
      crm: {
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: ''
      },
      aiAnalysis: {
        intent: 'General Support',
        confidence: 0,
        sentiment: 'Neutral',
        ragSources: []
      },
      status: 'ai'
    };

  }

}
