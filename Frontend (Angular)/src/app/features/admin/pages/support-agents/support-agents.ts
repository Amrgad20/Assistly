import { Component } from '@angular/core';

import { PageHeader } from '../../../../shared/ui/page-header/page-header';

import { AgentToolbar } from './components/agent-toolbar/agent-toolbar';
import { AgentList } from './components/agent-list/agent-list';
import { AgentForm } from './components/agent-form/agent-form';

@Component({
  selector: 'app-support-agents',
  standalone: true,
  imports: [
    PageHeader,
    AgentToolbar,
    AgentList,
    AgentForm
  ],
  templateUrl: './support-agents.html',
  styleUrl: './support-agents.scss'
})
export class SupportAgents {

}