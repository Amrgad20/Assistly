import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { TableColumn } from '../../../../shared/models/table-column.model';
import { TableAction } from '../../../../shared/models/table-action.model';

import { TicketService } from '../../../../core/services/ticket.service';
import { Ticket } from '../../../../core/models/ticket.model';

@Component({
  selector: 'app-customer-tickets',
  standalone: true,
  imports: [
    CommonModule,
    DataTable
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.scss'
})
export class Tickets {

  selectedTicket: Ticket | null = null;

  columns: TableColumn[] = [
    {
      key: 'id',
      label: 'Ticket ID'
    },
    {
      key: 'subject',
      label: 'Subject'
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'badge'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge'
    }
  ];

  actions: TableAction[] = [
    {
      label: 'View',
      color: 'primary',
      action: 'view'
    }
  ];

  constructor(
    private ticketService: TicketService
  ) {}

  get rows(): Ticket[] {
    return this.ticketService.getAll();
  }

  handleAction(
    event: {
      action: string;
      row: Ticket;
    }
  ): void {

    if (
      event.action === 'view'
    ) {
      this.selectedTicket =
        event.row;
    }

  }

  closeTicketDetails(): void {
    this.selectedTicket = null;
  }

  getAgentName(
    assignedAgentId: string
  ): string {

    const agents:
      Record<string, string> = {
        '1': 'Sarah Mitchell',
        '2': 'Daniel Carter'
      };

    return (
      agents[assignedAgentId] ??
      'Unassigned'
    );

  }

}