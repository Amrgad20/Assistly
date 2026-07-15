import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Attachment } from '../models/attachment.model';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { AuthService } from './auth.service';

interface ConversationSyncMessage {
  type: 'conversation-updated';
  conversation: Conversation;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  private readonly api =
    'http://127.0.0.1:8000';

  private socket: WebSocket | null = null;

  private reconnectTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  private reconnectAttempts = 0;

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

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {

    this.connectWebSocket();

    window.addEventListener(
      'online',
      () => this.connectWebSocket()
    );

    window.addEventListener(
      'assistly-auth-changed',
      () => {
        this.socket?.close();
        this.socket = null;
        this.connectWebSocket();
      }
    );

  }

  sendCustomerMessage(
    conversation: Conversation,
    text: string,
    attachments: Attachment[] = []
  ): void {

    const message: Message = {
      id: this.createMessageId(),
      sender: 'customer',
      text,
      createdAt: new Date(),
      attachments
    };

    conversation.messages.push(
      message
    );

    this.saveConversation(
      conversation
    );

    this.persistMessage(
      conversation,
      message
    );

  }

  sendAIMessage(
    conversation: Conversation,
    text: string
  ): void {

    const message: Message = {
      id: this.createMessageId(),
      sender: 'ai',
      text,
      createdAt: new Date(),
      attachments: []
    };

    conversation.messages.push(
      message
    );

    this.saveConversation(
      conversation
    );

    this.persistMessage(
      conversation,
      message
    );

  }

  sendAgentMessage(
    conversation: Conversation,
    text: string,
    attachments: Attachment[] = []
  ): void {

    const message: Message = {
      id: this.createMessageId(),
      sender: 'agent',
      text,
      createdAt: new Date(),
      attachments
    };

    conversation.messages.push(
      message
    );

    this.saveConversation(
      conversation
    );

    this.persistMessage(
      conversation,
      message
    );

  }

  saveConversation(
    conversation: Conversation
  ): void {

    if (
      !this.canCurrentUserAccess(
        conversation
      )
    ) {
      return;
    }

    const saved =
      this.getSavedConversations();

    saved[conversation.id] =
      conversation;

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(saved)
    );

    this.broadcastConversation(
      conversation
    );

  }

  getSavedConversation(
    conversationId: string
  ): Conversation | null {

    const saved =
      this.getSavedConversations();

    return (
      saved[conversationId] ??
      null
    );

  }

  async listBackendConversations():
    Promise<Conversation[] | null> {

    try {

      return await firstValueFrom(
        this.http.get<Conversation[]>(
          `${this.api}/conversations`
        )
      );

    } catch {

      return null;

    }

  }

  private broadcastConversation(
    conversation: Conversation
  ): void {

    if (!this.channel) return;

    const syncMessage:
      ConversationSyncMessage = {
        type: 'conversation-updated',
        conversation
      };

    this.channel.postMessage(
      syncMessage
    );

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

  private createMessageId(): string {

    return (
      `${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );

  }

  private persistMessage(
    conversation: Conversation,
    message: Message
  ): void {

    const attachments =
      message.attachments.map(
        attachment => ({
          id: attachment.id,
          type: attachment.type,
          name: attachment.name,
          url: attachment.url.startsWith(
            'data:'
          )
            ? ''
            : attachment.url
        })
      );

    void firstValueFrom(
      this.http.post(
        `${this.api}/conversations/${conversation.id}/messages`,
        {
          message_id: message.id,
          sender: message.sender,
          text: message.text,
          timestamp: message.createdAt,
          attachments,
          customer_id:
            conversation.customer.id,
          customer_name:
            conversation.customer.name,
          customer_email:
            conversation.customer.email,
          customer_phone:
            conversation.customer.phone,
          status: conversation.status,
          assigned_agent_id:
            conversation.assignedAgentId ??
            null,
          crm: conversation.crm,
          ai_analysis:
            conversation.aiAnalysis,
          ticket:
            conversation.ticket ?? null
        }
      )
    ).catch(() => {
      // LocalStorage remains the offline/demo fallback.
    });

  }

  private connectWebSocket(): void {

    if (
      this.socket?.readyState ===
        WebSocket.OPEN ||
      this.socket?.readyState ===
        WebSocket.CONNECTING
    ) {
      return;
    }

    const token =
      this.auth.getAccessToken();

    if (!token) {
      return;
    }

    const socketUrl =
      `${this.api.replace('http', 'ws')}` +
      `/conversations/ws/live?token=` +
      encodeURIComponent(token);

    const socket = new WebSocket(
      socketUrl
    );

    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
    };

    socket.onmessage = event => {

      try {

        const message = JSON.parse(
          event.data
        ) as ConversationSyncMessage;

        if (
          message.type !==
          'conversation-updated'
        ) {
          return;
        }

        this.applyRemoteConversation(
          message.conversation
        );

      } catch {

        // Ignore malformed real-time messages.

      }

    };

    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = null;
      }
      this.scheduleReconnect();
    };

    socket.onerror = () => {
      socket.close();
    };

  }

  private scheduleReconnect(): void {

    if (
      this.reconnectTimer ||
      !this.auth.getAccessToken()
    ) {
      return;
    }

    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      10000
    );

    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(
      () => {
        this.reconnectTimer = null;
        this.connectWebSocket();
      },
      delay
    );

  }

  private applyRemoteConversation(
    conversation: Conversation
  ): void {

    if (
      !this.canCurrentUserAccess(
        conversation
      )
    ) {
      return;
    }

    const normalized: Conversation = {
      ...conversation,
      messages: conversation.messages.map(
        message => ({
          ...message,
          createdAt: new Date(
            message.createdAt
          ),
          attachments:
            message.attachments ?? []
        })
      )
    };

    const saved =
      this.getSavedConversations();

    saved[normalized.id] = normalized;

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(saved)
    );

    this.broadcastConversation(
      normalized
    );

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

}
