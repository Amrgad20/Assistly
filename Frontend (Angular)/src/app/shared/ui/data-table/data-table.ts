import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableColumn } from '../../models/table-column.model';
import { TableAction } from '../../models/table-action.model';
import { Button } from '../button/button';
import { Badge } from '../badge/badge';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    Badge,
    Button
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTable {

  @Input() columns: TableColumn[] = [];

  @Input() rows: any[] = [];

  @Input() actions: TableAction[] = [];

  @Input() loading = false;

  @Input() emptyMessage = 'No data found';

  @Output() actionClick = new EventEmitter<{
    action: string;
    row: any;
  }>();

  onAction(action: string, row: any) {

    this.actionClick.emit({
      action,
      row
    });

  }

  getBadgeVariant(value: any): any {

    if (typeof value === 'boolean') {
      return value ? 'success' : 'danger';
    }

    switch (String(value).toLowerCase()) {

      case 'online':
      case 'resolved':
      case 'low':
        return 'success';

      case 'pending':
      case 'medium':
        return 'warning';

      case 'offline':
      case 'high':
        return 'danger';

      case 'open':
        return 'primary';

      default:
        return 'secondary';

    }

  }

  getBadgeText(value: any): string {

    if (typeof value === 'boolean') {
      return value ? 'Online' : 'Offline';
    }

    return String(value);

  }

}