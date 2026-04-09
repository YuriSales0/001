# HostMasters — Operações do Dia-a-Dia

## Ciclo de uma reserva

### 1. Reserva entra (Airbnb/Booking/Direct)
- Admin ou Manager cria a reserva em `/reservations`
- Sistema gera automaticamente:
  - Tarefas: CHECK_IN, CHECK_OUT, CLEANING
  - PricingDataPoint por noite (dados para AI)
  - Payout agendado com data calculada por plataforma

### 2. Antes do check-in
- Crew recebe tarefa CHECK_IN
- Crew faz checklist de preparação
- Smart lock configurado (se MID/PREMIUM)

### 3. Checkout
- Crew recebe tarefa CHECK_OUT + CLEANING
- Crew preenche relatório: condição (good/minor/major), danos, notas
- Admin recebe notificação se condição for "major"

### 4. Payout
- Admin vê payout agendado no dashboard
- Admin clica "Mark Paid"
- Owner recebe email com statement (gross/commission/net)
- Dashboard actualiza métricas

### 5. Relatório mensal (automático)
- Dia 1 do mês às 08:00 UTC
- Sistema calcula mês anterior por propriedade
- Email enviado ao owner com breakdown financeiro
- Owner pode ver detalhe em `/client/reports`

## Tipos de tarefas

| Tipo | Quem executa | Quando |
|------|-------------|--------|
| CLEANING | Crew | Após cada checkout |
| MAINTENANCE_PREVENTIVE | Crew/Supplier | Mensal (BASIC+) |
| MAINTENANCE_CORRECTIVE | Supplier | A pedido |
| INSPECTION | Crew/Manager | Pré e pós estadia |
| CHECK_IN | Crew | Dia de entrada |
| CHECK_OUT | Crew | Dia de saída |
| SHOPPING | Crew | Pré-chegada (PREMIUM) |
| LAUNDRY | Crew | Pós-checkout (PREMIUM) |

## Gestão de fornecedores

- Directório em `/manager/suppliers`
- Tipos: CLEANER, PLUMBER, ELECTRICIAN, GENERAL
- Associados a propriedades específicas
- Contacto directo (Call / Email) a partir da ficha

## CRM — Pipeline de leads

### Stages
NEW → FIRST_CONTACT → CALL_SCHEDULED → QUALIFIED → PROPOSAL_SENT → CONTRACT_SIGNED → ACTIVE_OWNER

### Qualificação BANT
- **Budget** — Tamanho da propriedade (1 bed, 2 bed, 3+ bed)
- **Authority** — Decisor (sole owner, co-owner, POA)
- **Need** — Disponibilidade anual (meses/ano)
- **Timeline** — Quando quer começar
- **Location** — Costa Tropical, zona adjacente, fora da zona

Score máximo: 100 pontos. Lead qualificado a partir de 60+.

## Alertas e auto-refresh

- Dashboard admin: refresh a cada 60s + quando janela ganha foco
- Dashboard manager: refresh a cada 5 min
- Alerta visual para: tarefas em atraso, payouts pendentes
