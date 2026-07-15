# Demo Accounts

All demo accounts use the password `12345678`.

## Admins

| Name | Email | Password |
| --- | --- | --- |
| Sarah Mitchell | `admin@assistly.ai` | `12345678` |
| Omar Khalil | `omar.khalil@assistly.ai` | `12345678` |

## Support Agents

| Name | Email | Password |
| --- | --- | --- |
| Daniel Carter | `agent@assistly.ai` | `12345678` |
| Layla Mansour | `layla.mansour@assistly.ai` | `12345678` |
| Yusuf Ali | `6` | `12345678` |
| Emma Collins | `emma.collins@assistly.ai` | `12345678` |
| Karim Nassar | `karim.nassar@assistly.ai` | `12345678` |

## Customers

| Name | Email | Password |
| --- | --- | --- |
| Ahmed Hassan | `customer@assistly.ai` | `12345678` |
| Mariam Adel | `mariam.adel@example.com` | `12345678` |
| Nour El-Sayed | `nour.elsayed@example.com` | `12345678` |
| James Wilson | `james.wilson@example.com` | `12345678` |
| Fatma Ibrahim | `fatma.ibrahim@example.com` | `12345678` |
| Lina Haddad | `lina.haddad@example.com` | `12345678` |
| Michael Brown | `michael.brown@example.com` | `12345678` |
| Salma Mostafa | `salma.mostafa@example.com` | `12345678` |
| David Chen | `david.chen@example.com` | `12345678` |
| Huda Farouk | `huda.farouk@example.com` | `12345678` |
| Adam Lewis | `adam.lewis@example.com` | `12345678` |
| Rana Samir | `rana.samir@example.com` | `12345678` |
| Peter Morgan | `peter.morgan@example.com` | `12345678` |
| Yasmin Tarek | `yasmin.tarek@example.com` | `12345678` |
| Khaled Mahmoud | `khaled.mahmoud@example.com` | `12345678` |

# Demo Statistics

- Admins: 2
- Agents: 5
- Customers: 15
- Tickets: 30
- Conversations: 15
- Conversation messages: 4–10 per conversation

Each customer owns one conversation and two tickets. Conversations are assigned evenly at three per support agent, and tickets are assigned evenly at six per support agent.

# Suggested Demo Flow

1. Log in as customer Ahmed Hassan using `customer@assistly.ai`.
2. Review Ahmed's mixed Arabic-English refund conversation and existing tickets.
3. Send a new refund-related message and demonstrate automatic ticket creation.
4. Log in as support agent Daniel Carter using `agent@assistly.ai`.
5. Show Daniel's assigned queue and reply to Ahmed.
6. Log in as admin Sarah Mitchell using `admin@assistly.ai`.
7. Show all customers, conversations, and tickets across the support team.
8. Open the Knowledge Base and demonstrate the existing RAG workflow.
9. Show the existing AI insights on a seeded conversation.

The seed is deterministic and idempotent: rerunning it updates the known demo records without duplicating them. Data visibility is still enforced by the authenticated backend role and record ownership.
