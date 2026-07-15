import { Injectable, computed, signal } from '@angular/core';

import { SupportAgent } from '../models/support-agent.model';

@Injectable({
  providedIn: 'root'
})
export class SupportAgentService {

  private agents = signal<SupportAgent[]>([
    {
      id: '1',
      name: 'Ahmed Ali',
      email: 'ahmed@assistly.ai',
      online: true
    },
    {
      id: '2',
      name: 'Sara Mohamed',
      email: 'sara@assistly.ai',
      online: false
    },
    {
      id: '3',
      name: 'Omar Hassan',
      email: 'omar@assistly.ai',
      online: true
    }
  ]);

  private search = signal('');

  readonly filteredAgents = computed(() => {

    const keyword = this.search().trim().toLowerCase();

    if (!keyword) {
      return this.agents();
    }

    return this.agents().filter(agent =>
      agent.name.toLowerCase().includes(keyword) ||
      agent.email.toLowerCase().includes(keyword)
    );

  });

  getAll(): SupportAgent[] {

    return this.filteredAgents();

  }

  setSearch(value: string) {

    this.search.set(value);

  }

  add(agent: SupportAgent) {

    this.agents.update(items => [...items, agent]);

  }

  update(agent: SupportAgent) {

    this.agents.update(items =>
      items.map(item =>
        item.id === agent.id ? agent : item
      )
    );

  }

  delete(id: string) {

    this.agents.update(items =>
      items.filter(item => item.id !== id)
    );

  }

}