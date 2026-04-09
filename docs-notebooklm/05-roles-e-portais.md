# HostMasters — Os 4 Roles e Portais

## Visão geral

| Role    | Portal  | URL          | Acesso |
|---------|---------|--------------|--------|
| ADMIN   | Admin   | `/`          | Tudo — payouts, invoices, marketing, AI, integrações, equipa |
| MANAGER | Manager | `/manager`   | Carteira própria (clientes com managerId=me), invoices, mensagens |
| CREW    | Crew    | `/crew`      | Tarefas operacionais, checklist, relatório de checkout |
| CLIENT  | Client  | `/client`    | Dashboard pessoal, ganhos, reservas, plano, AI (MID/PREMIUM) |

## ADMIN

Acesso total à plataforma. Cria utilizadores, aprova propriedades, emite payouts e invoices, vê todas as métricas.

### Funcionalidades do Admin
- **Dashboard** — Métricas em tempo real (volume, comissão, invoices pagos, receita total)
- **Properties** — Gestão com fluxo: PENDING_CLIENT → PENDING_APPROVAL → ACTIVE
- **Payouts** — Criação manual/automática, Mark Paid gera invoice + envia email
- **Invoices** — CRUD completo, tipos: RENTAL / SUBSCRIPTION / ADJUSTMENT
- **Calendar** — Reservas e bloqueios por propriedade
- **Team** — Gestão de utilizadores por role
- **CRM** — Pipeline de leads com score BANT, atribuição a campanhas
- **Marketing** — Campanhas com budget tracking, CPL por canal, registo de spend
- **Reports** — Relatórios financeiros por propriedade/mês, download PDF
- **AI Pricing** — Analytics de PricingDataPoint (dados recolhidos a cada reserva)
- **Integrations** — Roadmap: PriceLabs, Nordigen, Meta Ads, Brevo

## MANAGER

Vê apenas os clientes que lhe estão atribuídos (managerId). Acesso ao portal Admin mas dados filtrados.

### Funcionalidades do Manager
- Dashboard com métricas filtradas (só os seus owners)
- Clientes — lista e detalhe dos owners da sua carteira
- Reservas e calendário filtrados
- Tarefas operacionais
- Invoices dos seus clientes
- Mensagens com owners
- Fornecedores (suppliers) — directório de prestadores
- CRM — pipeline de leads (os seus)

## CREW

Acesso operacional. Foco em tarefas.

### Funcionalidades do Crew
- Lista de tarefas com filtros: hoje / abertas / concluídas
- Checklist interactivo (toggle por item, progresso em %)
- Relatório de checkout: condição (good / minor / major), danos, notas
- Calendar operacional

## CLIENT (Owner)

Proprietário do imóvel. Vê apenas os dados das suas propriedades.

### Funcionalidades do Client
- **My Home** — Dashboard pessoal com KPIs da(s) propriedade(s)
- **My Earnings** — Ganhos históricos, comissões, breakdown mensal
- **My Bookings** — Reservas activas e passadas
- **Care** — Pedidos de manutenção
- **My Plan** — Plano actual, comparação, upgrade via email
- **Contact us** — Mensagens directas com o Manager
- **AI Pricing** *(só MID/PREMIUM)* — Gráfico de sazonalidade com dados próprios

## Fluxo de criação de utilizadores

1. Admin vai a `/team`
2. Cria utilizador com role (MANAGER/CREW/CLIENT)
3. Se CLIENT: atribui propriedade ao owner
4. Se MANAGER: o manager fica disponível para atribuição a CLIENTs

## Hierarquia

```
ADMIN
  └── MANAGER (managerId → manager atribuído ao CLIENT)
        └── CLIENT (owner da propriedade)
CREW (operacional, sem hierarquia de gestão)
```
