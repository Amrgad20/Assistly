import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Button } from '../../../../../../shared/ui/button/button';

import { UiStateService } from '../../../../../../core/services/ui-state.service';
import { SupportAgentService } from '../../../../../../core/services/support-agent.service';

@Component({
  selector: 'app-agent-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Button
  ],
  templateUrl: './agent-toolbar.html',
  styleUrl: './agent-toolbar.scss'
})
export class AgentToolbar {

  search = '';

  constructor(
    private uiState: UiStateService,
    private service: SupportAgentService
  ) {}

  addAgent() {

    this.uiState.openCreateAgent();

  }

  onSearch(value: string) {

    this.search = value;

    this.service.setSearch(value);

  }

}