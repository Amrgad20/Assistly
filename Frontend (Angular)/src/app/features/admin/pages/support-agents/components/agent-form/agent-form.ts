import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputComponent } from '../../../../../../shared/ui/input/input';
import { Button } from '../../../../../../shared/ui/button/button';

import { UiStateService } from '../../../../../../core/services/ui-state.service';
import { SupportAgentService } from '../../../../../../core/services/support-agent.service';

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputComponent,
    Button
  ],
  templateUrl: './agent-form.html',
  styleUrl: './agent-form.scss'
})
export class AgentForm {

  name = '';

  email = '';

  constructor(

    public uiState: UiStateService,

    private service: SupportAgentService

  ) {

    effect(() => {

      const agent = this.uiState.currentAgent();

      if (agent) {

        this.name = agent.name;

        this.email = agent.email;

      } else {

        this.name = '';

        this.email = '';

      }

    });

  }

  close() {

    this.uiState.closeAgentModal();

  }

  save() {

    if (!this.name.trim() || !this.email.trim()) {

      return;

    }

    const editing = this.uiState.currentAgent();

    if (editing) {

      this.service.update({

        ...editing,

        name: this.name,

        email: this.email

      });

    } else {

      this.service.add({

        id: Date.now().toString(),

        name: this.name,

        email: this.email,

        online: false

      });

    }

    this.close();

  }

}