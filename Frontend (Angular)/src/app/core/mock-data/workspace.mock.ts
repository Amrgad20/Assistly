import { Workspace } from '../models/workspace.model';

export const workspace: Workspace = {

  id: '1',

  name: 'Assistly Demo Workspace',

  ownerName: 'Workspace Admin',

  ownerEmail: 'admin@assistly.ai',

  supportAgents: [],

  knowledgeBase: [],

  conversations: [

    {

      id: 'demo-conversation-ahmed',

      customer: {

        id: '3',

        name: 'Ahmed Hassan',

        email: 'customer@assistly.ai',

        phone: '01000000000'

      },

      messages: [

        {

          id: 'm1',

          sender: 'customer',

          text: 'My order arrived damaged.',

          createdAt: new Date(),

          attachments: []

        }

      ],

      crm: {

        totalOrders: 8,

        totalSpent: 5200,

        lastOrder: '#10024'

      },

      aiAnalysis: {

        intent: 'Damaged Product',

        confidence: 96,

        sentiment: 'Negative',

        ragSources: []

      },

      assignedAgentId: '2',

      status: 'agent'

    }

  ]

};
