import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { User } from '../models/user.model';

interface DemoAccount {
  user: User;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly api =
    'http://127.0.0.1:8000';

  private readonly tokenKey =
    'assistlyAccessToken';

  private currentUser: User | null = null;

  private readonly registeredAccountsKey =
    'assistlyRegisteredAccounts';

  private readonly demoAccounts: DemoAccount[] = [
    {
      user: {
        id: '1',
        name: 'Sarah Mitchell',
        email: 'admin@assistly.ai',
        role: 'admin'
      },
      password: 'Admin@2026'
    },
    {
      user: {
        id: '2',
        name: 'Daniel Carter',
        email: 'agent@assistly.ai',
        role: 'agent'
      },
      password: 'Agent@2026'
    },
    {
      user: {
        id: '3',
        name: 'Ahmed Hassan',
        email: 'customer@assistly.ai',
        role: 'customer'
      },
      password: 'Customer@2026'
    }
  ];

  constructor(
    private http: HttpClient
  ) {

    this.restoreCurrentUser();

  }

  async login(
    email: string,
    password: string,
    remember = false
  ): Promise<User | null> {

    const normalizedEmail =
      email.trim().toLowerCase();

    try {

      const response = await firstValueFrom(
        this.http.post<{
          access_token: string;
          token_type: string;
          user: User;
        }>(
          `${this.api}/auth/login`,
          {
            email: normalizedEmail,
            password
          }
        )
      );

      this.storeSession(
        response.user,
        remember,
        response.access_token
      );

      return response.user;

    } catch (error) {

      if (
        error instanceof HttpErrorResponse &&
        error.status !== 0
      ) {
        return null;
      }

    }

    const account = this.getAllAccounts()
      .find(item =>
        item.user.email.toLowerCase() ===
          normalizedEmail &&
        item.password === password
      );

    if (!account) {

      return null;

    }

    this.storeSession(
      account.user,
      remember
    );

    return this.currentUser;

  }

  async registerCustomer(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResult> {

    const normalizedEmail =
      email.trim().toLowerCase();

    try {

      return await firstValueFrom(
        this.http.post<RegisterResult>(
          `${this.api}/auth/register`,
          {
            name: name.trim(),
            email: normalizedEmail,
            password
          }
        )
      );

    } catch (error) {

      if (
        error instanceof HttpErrorResponse &&
        error.status !== 0
      ) {
        return {
          success: false,
          message:
            error.error?.detail ??
            'Account registration failed.'
        };
      }

    }

    const exists = this.getAllAccounts()
      .some(item =>
        item.user.email.toLowerCase() ===
        normalizedEmail
      );

    if (exists) {

      return {
        success: false,
        message:
          'An account with this email already exists.'
      };

    }

    const registeredAccounts =
      this.getRegisteredAccounts();

    const newAccount: DemoAccount = {
      user: {
        id: this.createCustomerId(),
        name: name.trim(),
        email: normalizedEmail,
        role: 'customer'
      },
      password
    };

    registeredAccounts.push(
      newAccount
    );

    localStorage.setItem(
      this.registeredAccountsKey,
      JSON.stringify(
        registeredAccounts
      )
    );

    return {
      success: true,
      message:
        'Account created successfully.'
    };

  }

  getCurrentUser(): User | null {

    if (this.currentUser) {

      return this.currentUser;

    }

    this.restoreCurrentUser();

    return this.currentUser;

  }

  isLoggedIn(): boolean {

    return this.getCurrentUser() !== null;

  }

  getAccessToken(): string | null {

    return (
      localStorage.getItem(
        this.tokenKey
      ) ||
      sessionStorage.getItem(
        this.tokenKey
      )
    );

  }

  updateCurrentUser(
    user: User
  ): void {

    this.currentUser = {
      ...user
    };

    const storage =
      localStorage.getItem(
        'currentUser'
      )
        ? localStorage
        : sessionStorage;

    storage.setItem(
      'currentUser',
      JSON.stringify(
        this.currentUser
      )
    );

    this.updateRegisteredAccount(
      user
    );

  }

  logout(): void {

    this.currentUser = null;

    localStorage.removeItem(
      'currentUser'
    );

    sessionStorage.removeItem(
      'currentUser'
    );

    localStorage.removeItem(
      this.tokenKey
    );

    sessionStorage.removeItem(
      this.tokenKey
    );

    window.dispatchEvent(
      new Event(
        'assistly-auth-changed'
      )
    );

  }

  private getAllAccounts():
    DemoAccount[] {

    return [
      ...this.demoAccounts,
      ...this.getRegisteredAccounts()
    ];

  }

  private getRegisteredAccounts():
    DemoAccount[] {

    const raw =
      localStorage.getItem(
        this.registeredAccountsKey
      );

    if (!raw) {

      return [];

    }

    try {

      return JSON.parse(
        raw
      ) as DemoAccount[];

    } catch {

      localStorage.removeItem(
        this.registeredAccountsKey
      );

      return [];

    }

  }

  private updateRegisteredAccount(
    user: User
  ): void {

    const accounts =
      this.getRegisteredAccounts();

    const index = accounts.findIndex(
      item =>
        item.user.id === user.id
    );

    if (index < 0) {

      return;

    }

    accounts[index] = {
      ...accounts[index],
      user: {
        ...user
      }
    };

    localStorage.setItem(
      this.registeredAccountsKey,
      JSON.stringify(accounts)
    );

  }

  private restoreCurrentUser(): void {

    const savedUser =
      localStorage.getItem(
        'currentUser'
      ) ||
      sessionStorage.getItem(
        'currentUser'
      );

    if (!savedUser) {

      this.currentUser = null;

      return;

    }

    try {

      this.currentUser = JSON.parse(
        savedUser
      ) as User;

    } catch {

      this.logout();

    }

  }

  private createCustomerId(): string {

    return (
      `customer-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 7)
    );

  }

  private storeSession(
    user: User,
    remember: boolean,
    token?: string
  ): void {

    this.currentUser = {
      ...user
    };

    const storage = remember
      ? localStorage
      : sessionStorage;

    localStorage.removeItem(
      'currentUser'
    );

    sessionStorage.removeItem(
      'currentUser'
    );

    localStorage.removeItem(
      this.tokenKey
    );

    sessionStorage.removeItem(
      this.tokenKey
    );

    storage.setItem(
      'currentUser',
      JSON.stringify(
        this.currentUser
      )
    );

    if (token) {
      storage.setItem(
        this.tokenKey,
        token
      );
    }

    window.dispatchEvent(
      new Event(
        'assistly-auth-changed'
      )
    );

  }

}
