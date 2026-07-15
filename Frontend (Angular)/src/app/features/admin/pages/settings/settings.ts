import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AppSettings {
  appName: string;
  supportEmail: string;
  autoAssign: boolean;
  aiEscalation: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings {

  appName = 'Assistly';

  supportEmail = 'support@assistly.com';

  autoAssign = true;

  aiEscalation = true;

  saving = false;

  successMessage = '';

  errorMessage = '';

  private readonly storageKey =
    'assistlyPlatformSettings';

  constructor() {

    this.loadSettings();

  }

  saveSettings(): void {

    this.successMessage = '';

    this.errorMessage = '';

    const trimmedAppName =
      this.appName.trim();

    const trimmedEmail =
      this.supportEmail
        .trim()
        .toLowerCase();

    if (!trimmedAppName) {

      this.errorMessage =
        'Application name is required.';

      return;

    }

    if (!this.isValidEmail(trimmedEmail)) {

      this.errorMessage =
        'Please enter a valid support email address.';

      return;

    }

    this.saving = true;

    const settings: AppSettings = {
      appName: trimmedAppName,
      supportEmail: trimmedEmail,
      autoAssign: this.autoAssign,
      aiEscalation: this.aiEscalation
    };

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(settings)
    );

    this.appName =
      settings.appName;

    this.supportEmail =
      settings.supportEmail;

    this.saving = false;

    this.successMessage =
      'Settings saved successfully.';

  }

  private loadSettings(): void {

    const savedSettings =
      localStorage.getItem(
        this.storageKey
      );

    if (!savedSettings) {

      return;

    }

    try {

      const settings =
        JSON.parse(
          savedSettings
        ) as AppSettings;

      this.appName =
        settings.appName ?? 'Assistly';

      this.supportEmail =
        settings.supportEmail ??
        'support@assistly.com';

      this.autoAssign =
        settings.autoAssign ?? true;

      this.aiEscalation =
        settings.aiEscalation ?? true;

    } catch {

      localStorage.removeItem(
        this.storageKey
      );

    }

  }

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  }

}