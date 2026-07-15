import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Conversation } from '../models/conversation.model';
import { Ticket } from '../models/ticket.model';
import { AuthService } from './auth.service';

interface TicketAnalysis {
  intent?: string;
  escalate?: boolean;
}

interface TicketIssue {
  key: string;
  subject: string;
  category: string;
  priority: Ticket['priority'];
}

interface TicketSyncMessage {
  type: 'tickets-updated';
  tickets: Ticket[];
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  private readonly api =
    'http://127.0.0.1:8000';

  private readonly storageKeyPrefix =
    'assistlyTickets';

  private readonly channelName =
    'assistly-tickets';

  private readonly channel:
    BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(
          this.channelName
        )
      : null;

  private tickets = signal<Ticket[]>(
    []
  );

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) {

    this.tickets.set(
      this.loadTickets()
    );

    this.listenForBroadcastUpdates();

    this.listenForStorageUpdates();

    void this.loadBackendTickets();

    window.addEventListener(
      'assistly-auth-changed',
      () => {
        this.tickets.set(
          this.loadTickets()
        );
        void this.loadBackendTickets();
      }
    );

  }

  getAll(): Ticket[] {
    return this.tickets().filter(
      ticket =>
        this.canCurrentUserAccess(
          ticket
        )
    );
  }

  getById(id: string): Ticket | null {
    return (
      this.tickets().find(
        ticket => ticket.id === id
      ) ?? null
    );
  }

  add(ticket: Ticket): void {

    if (this.getById(ticket.id)) {
      return;
    }

    this.tickets.update(items => [
      ...items,
      ticket
    ]);

    this.saveTickets();

    void this.persistAutomaticTicket(
      ticket
    );
  }

  update(ticket: Ticket): void {
    this.tickets.update(items =>
      items.map(item =>
        item.id === ticket.id
          ? ticket
          : item
      )
    );

    this.saveTickets();
  }

  delete(id: string): void {
    this.tickets.update(items =>
      items.filter(item =>
        item.id !== id
      )
    );

    this.saveTickets();
  }

  createAutomaticTicket(
    conversation: Conversation,
    customerMessage: string,
    analysis: TicketAnalysis = {}
  ): Ticket | null {

    const issue = this.detectIssue(
      customerMessage,
      analysis
    );

    if (!issue) {
      return null;
    }

    const existing = this.tickets()
      .find(ticket =>
        ticket.conversationId ===
          conversation.id &&
        ticket.issueKey === issue.key
      );

    if (existing) {
      return null;
    }

    const now = new Date();

    const orderNumber =
      this.extractOrderNumber(
        customerMessage
      ) ??
      this.normalizeOrderNumber(
        conversation.crm.lastOrder
      );

    const currentUser =
      this.auth.getCurrentUser();

    const ticket: Ticket = {
      id: this.createTicketId(),
      customerId:
        currentUser?.role === 'customer'
          ? currentUser.id
          : conversation.customer.id,
      subject: issue.subject,
      customer:
        currentUser?.role === 'customer'
          ? currentUser.name
          : conversation.customer.name,
      description:
        customerMessage.trim() ||
        'The customer uploaded evidence of a damaged product.',
      category: issue.category,
      priority: issue.priority,
      status: 'open',
      assignedAgentId: '2',
      createdAt: now,
      updatedAt: now,
      conversationId: conversation.id,
      issueKey: issue.key,
      ...(orderNumber
        ? { orderNumber }
        : {})
    };

    this.add(ticket);

    return ticket;

  }

  private loadTickets(): Ticket[] {
    const saved =
      localStorage.getItem(
        this.storageKey
      );

    if (saved) {
      try {
        const parsed =
          JSON.parse(saved) as Ticket[];

        return parsed.map(
          ticket => ({
            ...ticket,
            createdAt: new Date(
              ticket.createdAt
            ),
            updatedAt: new Date(
              ticket.updatedAt
            )
          })
        ).filter(ticket =>
          this.canCurrentUserAccess(
            ticket
          )
        );
      } catch {
        localStorage.removeItem(
          this.storageKey
        );
      }
    }

    const fallbackTickets: Ticket[] = [
      {
        id: 'TK-1001',
        subject: 'Cannot login to account',
        customer: 'Ahmed Ali',
        priority: 'high',
        status: 'open',
        assignedAgentId: '2',
        description:
          'The customer cannot access the account after multiple password reset attempts.',
        createdAt: new Date(
          '2026-07-10T10:15:00'
        ),
        updatedAt: new Date(
          '2026-07-10T12:30:00'
        ),
        category: 'Account Support'
      },
      {
        id: 'TK-1002',
        subject: 'Refund request',
        customer: 'Omar Hassan',
        priority: 'medium',
        status: 'pending',
        assignedAgentId: '1',
        description:
          'The customer requested a refund for an order that was delivered damaged.',
        createdAt: new Date(
          '2026-07-09T09:20:00'
        ),
        updatedAt: new Date(
          '2026-07-10T08:45:00'
        ),
        category: 'Refund',
        orderNumber: 'ORD-54821'
      },
      {
        id: 'TK-1003',
        subject: 'Payment completed twice',
        customer: 'Mohamed Adel',
        priority: 'low',
        status: 'resolved',
        assignedAgentId: '2',
        description:
          'The customer was charged twice for the same order.',
        createdAt: new Date(
          '2026-07-05T14:05:00'
        ),
        updatedAt: new Date(
          '2026-07-06T16:10:00'
        ),
        category: 'Payment'
      }
    ];

    return fallbackTickets.filter(
      ticket =>
        this.canCurrentUserAccess(
          ticket
        )
    );
  }

  private saveTickets(): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(
        this.tickets()
      )
    );

    this.channel?.postMessage({
      type: 'tickets-updated',
      tickets: this.tickets()
    } satisfies TicketSyncMessage);
  }

  private listenForBroadcastUpdates(): void {

    if (!this.channel) return;

    this.channel.onmessage = (
      event: MessageEvent<TicketSyncMessage>
    ) => {

      if (
        event.data.type !==
        'tickets-updated'
      ) {
        return;
      }

      this.applyIncomingTickets(
        event.data.tickets
      );

    };

  }

  private listenForStorageUpdates(): void {

    window.addEventListener(
      'storage',
      event => {

        if (
          event.key !== this.storageKey ||
          !event.newValue
        ) {
          return;
        }

        try {

          this.applyIncomingTickets(
            JSON.parse(
              event.newValue
            ) as Ticket[]
          );

        } catch {

          // Ignore malformed updates from another tab.

        }

      }
    );

  }

  private applyIncomingTickets(
    tickets: Ticket[]
  ): void {

    this.tickets.set(
      tickets
        .filter(ticket =>
          this.canCurrentUserAccess(
            ticket
          )
        )
        .map(ticket => ({
          ...ticket,
          createdAt: new Date(
            ticket.createdAt
          ),
          updatedAt: new Date(
            ticket.updatedAt
          )
        }))
    );

  }

  private detectIssue(
    message: string,
    analysis: TicketAnalysis
  ): TicketIssue | null {

    const text = message.toLowerCase();

    const intent = (
      analysis.intent ?? ''
    ).toLowerCase();

    const hasRefund =
      /\b(refund|return|money back|reimburse)/.test(text) ||
      /(استرداد|استرجاع|ارجاع|إرجاع|فلوسي)/.test(text) ||
      intent.includes('refund');

    const hasDamage =
      /\b(damaged|broken|defective|cracked)/.test(text) ||
      /(تالف|تلفة|تالفه|مكسور|مكسورة|معيوب)/.test(text) ||
      intent.includes('damaged');

    if (hasRefund || hasDamage) {
      return {
        key: 'order-resolution',
        subject:
          hasRefund && hasDamage
            ? 'Damaged product refund request'
            : hasRefund
              ? 'Refund request'
              : 'Damaged product',
        category:
          hasRefund
            ? 'Refund'
            : 'Damaged Product',
        priority: 'high'
      };
    }

    const needsHuman =
      /\b(human|real person|live agent|support agent|representative)/.test(text) ||
      /(موظف|شخص حقيقي|خدمة العملاء|دعم بشري)/.test(text);

    if (needsHuman) {
      return {
        key: 'human-agent',
        subject: 'Human agent requested',
        category: 'Escalation',
        priority: 'medium'
      };
    }

    const accountAccess =
      /\b(can'?t log ?in|cannot log ?in|locked out|account access|password reset failed)/.test(text) ||
      /(لا أستطيع الدخول|مش قادر ادخل|الحساب مقفول|نسيت كلمة المرور)/.test(text) ||
      intent.includes('account_issue');

    if (accountAccess) {
      return {
        key: 'account-access',
        subject: 'Account access support',
        category: 'Account Support',
        priority: 'high'
      };
    }

    const seriousShipping =
      /\b(lost|never arrived|missing package|serious shipping|very late|weeks? late)/.test(text) ||
      /(لم يصل|ضائع|الشحنة مفقودة|متأخر جدا|متأخرة جدا)/.test(text);

    if (seriousShipping) {
      return {
        key: 'serious-shipping',
        subject: 'Serious shipping issue',
        category: 'Shipping',
        priority: 'high'
      };
    }

    if (analysis.escalate) {
      return {
        key: 'escalation',
        subject: 'Customer support escalation',
        category: 'Escalation',
        priority: 'high'
      };
    }

    return null;

  }

  private extractOrderNumber(
    message: string
  ): string | undefined {

    const match = message.match(
      /(?:order|طلب)\s*(?:number|no\.?|رقم)?\s*[:#-]?\s*([a-z0-9-]{4,})/i
    );

    return match
      ? this.normalizeOrderNumber(
          match[1]
        )
      : undefined;

  }

  private normalizeOrderNumber(
    value: string | undefined
  ): string | undefined {

    const normalized = value
      ?.trim()
      .replace(/^#/, '');

    return normalized || undefined;

  }

  private createTicketId(): string {

    return (
      `TK-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()
    );

  }

  private async loadBackendTickets():
    Promise<void> {

    try {

      const backendTickets =
        await firstValueFrom(
          this.http.get<Ticket[]>(
            `${this.api}/tickets`
          )
        );

      this.applyIncomingTickets(
        backendTickets
      );

      this.saveTickets();

    } catch {

      // LocalStorage remains the offline/demo fallback.

    }

  }

  private async persistAutomaticTicket(
    ticket: Ticket
  ): Promise<void> {

    if (
      !ticket.conversationId ||
      !ticket.issueKey
    ) {
      return;
    }

    try {

      const result = await firstValueFrom(
        this.http.post<{
          created: boolean;
          ticket: Ticket;
        }>(
          `${this.api}/tickets/auto`,
          {
            id: ticket.id,
            conversation_id:
              ticket.conversationId,
            issue_key: ticket.issueKey,
            subject: ticket.subject,
            customer: ticket.customer,
            description:
              ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            assigned_agent_id:
              ticket.assignedAgentId,
            order_number:
              ticket.orderNumber ?? null,
            created_at: ticket.createdAt,
            updated_at: ticket.updatedAt
          }
        )
      );

      this.tickets.update(items => [
        ...items.filter(
          item =>
            item.id !== ticket.id &&
            item.id !== result.ticket.id
        ),
        {
          ...result.ticket,
          createdAt: new Date(
            result.ticket.createdAt
          ),
          updatedAt: new Date(
            result.ticket.updatedAt
          )
        }
      ]);

      this.saveTickets();

    } catch {

      // The local ticket is already durable in LocalStorage.

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
    ticket: Ticket
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
        ticket.assignedAgentId ===
        user.id
      );
    }

    return ticket.customerId === user.id;

  }

}
