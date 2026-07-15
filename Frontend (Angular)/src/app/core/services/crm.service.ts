import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface CrmCustomerListItem {
  id: string;
  name: string;
  email: string;
  status: string;
  lastContact: string;
}

export interface CustomerCrmDetails {
  found: boolean;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    notes: string[];
  };
  latest_order: unknown;
  open_tickets: unknown[];
  orders: unknown[];
  tickets: unknown[];
}

@Injectable({
  providedIn: 'root',
})
export class Crm {

  private readonly api =
    'http://127.0.0.1:8000';

  constructor(
    private http: HttpClient
  ) {}

  listCustomers():
    Promise<CrmCustomerListItem[]> {

    return firstValueFrom(
      this.http.get<CrmCustomerListItem[]>(
        `${this.api}/crm/customers`
      )
    );

  }

  getMyCrm():
    Promise<CustomerCrmDetails> {

    return firstValueFrom(
      this.http.get<CustomerCrmDetails>(
        `${this.api}/crm/me`
      )
    );

  }

}
