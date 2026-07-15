import {
  Component,
  effect
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputComponent } from '../../../../../../shared/ui/input/input';
import { SelectComponent } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';

import { Ticket } from '../../../../../../core/models/ticket.model';

import { TicketPageService } from '../../services/ticket-page.service';
import { TicketService } from '../../../../../../core/services/ticket.service';
import { SupportAgentService } from '../../../../../../core/services/support-agent.service';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputComponent,
    SelectComponent,
    Button
  ],
  templateUrl: './ticket-form.html',
  styleUrl: './ticket-form.scss'
})
export class TicketForm {

  subject = '';

  customer = '';

  priority: Ticket['priority'] =
    'medium';

  status: Ticket['status'] =
    'open';

  assignedAgentId = '';

  description = '';

  category =
    'General Support';

  orderNumber = '';

  priorityOptions = [
    {
      label: 'High',
      value: 'high'
    },
    {
      label: 'Medium',
      value: 'medium'
    },
    {
      label: 'Low',
      value: 'low'
    }
  ];

  statusOptions = [
    {
      label: 'Open',
      value: 'open'
    },
    {
      label: 'Pending',
      value: 'pending'
    },
    {
      label: 'Resolved',
      value: 'resolved'
    }
  ];

  categoryOptions = [
    {
      label: 'General Support',
      value: 'General Support'
    },
    {
      label: 'Account Support',
      value: 'Account Support'
    },
    {
      label: 'Refund',
      value: 'Refund'
    },
    {
      label: 'Payment',
      value: 'Payment'
    },
    {
      label: 'Shipping',
      value: 'Shipping'
    },
    {
      label: 'Product Damage',
      value: 'Product Damage'
    }
  ];

  constructor(
    public page: TicketPageService,
    private ticketService: TicketService,
    private agentService: SupportAgentService
  ) {

    effect(() => {

      const ticket =
        this.page.currentTicket();

      if (ticket) {

        this.subject =
          ticket.subject;

        this.customer =
          ticket.customer;

        this.priority =
          ticket.priority;

        this.status =
          ticket.status;

        this.assignedAgentId =
          ticket.assignedAgentId;

        this.description =
          ticket.description ?? '';

        this.category =
          ticket.category ??
          'General Support';

        this.orderNumber =
          ticket.orderNumber ?? '';

      } else {

        this.resetForm();

      }

    });

  }

  get agentOptions() {

    return this.agentService
      .getAll()
      .map(agent => ({
        label: agent.name,
        value: agent.id
      }));

  }

  close(): void {

    this.page.closeForm();

  }

  save(): void {

    const subject =
      this.subject.trim();

    const customer =
      this.customer.trim();

    const description =
      this.description.trim();

    const category =
      this.category.trim();

    const orderNumber =
      this.orderNumber.trim();

    if (
      !subject ||
      !customer ||
      !description ||
      !category ||
      !this.assignedAgentId
    ) {

      alert(
        'Please fill all required fields.'
      );

      return;

    }

    const currentTicket =
      this.page.currentTicket();

    const now = new Date();

    const ticket: Ticket = {

      id:
        this.page.isEditMode &&
        currentTicket
          ? currentTicket.id
          : `TK-${Date.now()}`,

      subject,

      customer,

      priority:
        this.priority,

      status:
        this.status,

      assignedAgentId:
        this.assignedAgentId,

      description,

      category,

      orderNumber:
        orderNumber || undefined,

      createdAt:
        this.page.isEditMode &&
        currentTicket
          ? new Date(
              currentTicket.createdAt
            )
          : now,

      updatedAt:
        now

    };

    if (this.page.isEditMode) {

      this.ticketService.update(
        ticket
      );

    } else {

      this.ticketService.add(
        ticket
      );

    }

    this.close();

  }

  private resetForm(): void {

    this.subject = '';

    this.customer = '';

    this.priority = 'medium';

    this.status = 'open';

    this.assignedAgentId = '';

    this.description = '';

    this.category =
      'General Support';

    this.orderNumber = '';

  }

}