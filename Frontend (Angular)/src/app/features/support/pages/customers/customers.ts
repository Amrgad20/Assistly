import {
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { TableColumn } from '../../../../shared/models/table-column.model';
import {
  Crm,
  CrmCustomerListItem
} from '../../../../core/services/crm.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    DataTable
  ],
  templateUrl: './customers.html',
  styleUrl: './customers.scss'
})
export class Customers implements OnInit {

  columns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'lastContact', label: 'Last Contact' }
  ];

  rows: CrmCustomerListItem[] = [];

  constructor(
    private crm: Crm
  ) {}

  async ngOnInit(): Promise<void> {

    try {
      this.rows =
        await this.crm.listCustomers();
    } catch {
      this.rows = [];
    }

  }

}
