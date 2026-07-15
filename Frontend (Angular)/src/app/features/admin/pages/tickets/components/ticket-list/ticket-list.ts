import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTable } from '../../../../../../shared/ui/data-table/data-table';
import { TableColumn } from '../../../../../../shared/models/table-column.model';
import { TableAction } from '../../../../../../shared/models/table-action.model';

import { TicketService } from '../../../../../../core/services/ticket.service';
import { SupportAgentService } from '../../../../../../core/services/support-agent.service';

import { TicketPageService } from '../../services/ticket-page.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTable
  ],
  templateUrl: './ticket-list.html',
  styleUrl: './ticket-list.scss'
})
export class TicketList {

  @Input() mode: 'admin' | 'support' = 'admin';

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
      key: 'customer',
      label: 'Customer'
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
    },
    {
      key: 'assignedAgent',
      label: 'Assigned Agent'
    }
  ];

  constructor(
    private ticketService: TicketService,
    private page: TicketPageService,
    private agentService: SupportAgentService
  ) {}

  get actions(): TableAction[] {

    if (this.mode === 'support') {
      return [
        {
          label: 'Edit',
          color: 'primary',
          action: 'edit'
        }
      ];
    }

    return [
      {
        label: 'Edit',
        color: 'primary',
        action: 'edit'
      },
      {
        label: 'Delete',
        color: 'danger',
        action: 'delete'
      }
    ];

  }

  get rows() {

    const search =
      this.page
        .searchText()
        .toLowerCase()
        .trim();

    const tickets =
      this.ticketService.getAll();

    const mappedTickets =
      tickets.map(ticket => ({
        ...ticket,
        assignedAgent:
          this.getAgentName(
            ticket.assignedAgentId
          )
      }));

    if (!search) {
      return mappedTickets;
    }

    return mappedTickets.filter(
      ticket =>
        ticket.id
          .toLowerCase()
          .includes(search) ||

        ticket.subject
          .toLowerCase()
          .includes(search) ||

        ticket.customer
          .toLowerCase()
          .includes(search) ||

        ticket.assignedAgent
          .toLowerCase()
          .includes(search) ||

        ticket.priority
          .toLowerCase()
          .includes(search) ||

        ticket.status
          .toLowerCase()
          .includes(search)
    );

  }

  getAgentName(
    agentId: string
  ): string {

    return (
      this.agentService
        .getAll()
        .find(
          agent =>
            agent.id === agentId
        )
        ?.name ?? '-'
    );

  }

  handleAction(event: {
    action: string;
    row: any;
  }): void {

    switch (event.action) {

      case 'delete':

        if (
          confirm(
            `Delete ticket ${event.row.id}?`
          )
        ) {
          this.ticketService.delete(
            event.row.id
          );
        }

        break;

      case 'edit':

        this.page.startEdit(
          event.row
        );

        break;

    }

  }

}
