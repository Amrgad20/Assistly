import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTable } from '../../../../../../shared/ui/data-table/data-table';

import { TableColumn } from '../../../../../../shared/models/table-column.model';
import { TableAction } from '../../../../../../shared/models/table-action.model';

import { SupportAgentService } from '../../../../../../core/services/support-agent.service';
import { UiStateService } from '../../../../../../core/services/ui-state.service';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTable
  ],
  templateUrl: './agent-list.html',
  styleUrl: './agent-list.scss'
})
export class AgentList {

  constructor(
    public service: SupportAgentService,
    private uiState: UiStateService
  ) {}

  columns: TableColumn[] = [

    {
      key: 'name',
      label: 'Name'
    },

    {
      key: 'email',
      label: 'Email'
    },

    {
      key: 'online',
      label: 'Status',
      type: 'badge'
    }

  ];

  actions: TableAction[] = [

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

  get rows() {

    return this.service.getAll();

  }

  handleAction(event: any) {

    switch (event.action) {

      case 'edit':

        this.uiState.openEditAgent(event.row);

        break;

      case 'delete':

        if (confirm('Delete this support agent?')) {

          this.service.delete(event.row.id);

        }

        break;

    }

  }

}