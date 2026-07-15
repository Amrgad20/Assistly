import { Injectable, signal } from '@angular/core';

import { SupportAgent } from '../models/support-agent.model';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {

  private agentModal = signal(false);

  readonly isAgentModalOpen = this.agentModal.asReadonly();

  private editingAgent = signal<SupportAgent | null>(null);

  readonly currentAgent = this.editingAgent.asReadonly();

  openCreateAgent() {

    this.editingAgent.set(null);

    this.agentModal.set(true);

  }

  openEditAgent(agent: SupportAgent) {

    this.editingAgent.set(agent);

    this.agentModal.set(true);

  }

  closeAgentModal() {

    this.agentModal.set(false);

    this.editingAgent.set(null);

  }

}