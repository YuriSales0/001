# HostMasters — Contexto do Projecto

SaaS B2B de gestão de propriedades de arrendamento de curta duração na **Costa Tropical, Espanha (Granada)**.
Mercado-alvo: proprietários internacionais (UK, Suécia, Noruega, Holanda, Alemanha) que compram casas como investimento.

## Modelo de Negócio — Platform Marketplace

```
HostMasters (plataforma + Crew própria)
        ↕
Managers (rede de closers/CS — atraem proprietários)
        ↕
Proprietários (clientes finais que pagam)
        ↕
Crew (pool gig certificada + Crew Captain fixo)
```

**Princípio central**: "O teu Manager muda. Os standards não."
A qualidade vem da Crew com checklists, fotos obrigatórias e aprovação do Captain — não de uma pessoa específica.

## Stack

- Next.js 14 App Router + TypeScript + Tailwind
- PostgreSQL + Prisma ORM
- NextAuth.js (4 roles: ADMIN / MANAGER / CREW / CLIENT)
- Resend (email) · Stripe + Stripe Connect (pagamentos) · Vercel (hosting)
- Anthropic Claude (AI chat, pricing engine, scraper, monitor)
- Vitest (testes) · i18n: 8 idiomas (EN, PT, ES, DE, NL, FR, SV, DA)

## Comandos

```bash
npm run dev          # servidor local
npm test             # unit tests (Vitest)
npm run test:watch   # watch mode
npm run build        # prisma migrate deploy + prisma generate + next build
npm run seed         # seed da base de dados
```

## Deploy

Cada `git push origin main` faz deploy automático no Vercel. Branch de trabalho: `main`.

## Os Roles

### ADMIN (Yuri / HM)
Gestão total. Recruta Managers, controla standards, responsável legal/fiscal.
Yuri é também o primeiro **Crew Captain** até ter volume para delegar.

### MANAGER
- **Papel**: SDR + Closer + Customer Success (NÃO operacional)
- **Perfil**: expatriado na Costa Tropical, fala nativo a língua dos proprietários
- **Modelo Uber**: sem licença obrigatória, basta ser autónomo em Espanha
- **Território exclusivo** por zona, contrato mínimo 6 meses
- **NÃO contacta Crew directamente** — passa sempre pelo Captain
- Manager só recebe a partir do plano **Basic** (Starter = €0 para Manager)

### CREW (Gig Pool)
- Pool certificada de autónomos — **não são empregados** (protecção Lei Rider)
- Pagamento **toda quarta-feira** via Stripe Connect (tarefas aprovadas da semana anterior)
- Statement automático via Resend após cada payout
- Smart Lock obrigatório: código temporário por tarefa, expira após conclusão
- Sem submissão de fotos → sem pagamento
- Score global (0-500+) com 5 níveis: Suspenso → Básico → Verificado → Expert → Elite
- Redistribuição automática: não confirma em 30min → redireciona + penaliza score

### CREW CAPTAIN (subtype de CREW)
- Único membro fixo da operação — supervisor de campo
- Valida trabalho da Crew gig, treina e certifica, resolve problemas
- Auto-valida Elite (score 500+)
- Recebe alertas 🔴🟡 do AI Monitor

### CLIENT (Proprietário)
- Portal de transparência total: earnings, bookings, care, fiscal
- Lock-in via dados históricos + relatórios fiscais + AI pricing

| Role | URL |
|------|-----|
| ADMIN | `/` (route group `(admin)`) |
| MANAGER | `/manager` |
| CREW | `/crew` |
| CLIENT | `/client` |

## Planos e Preços

| Plano | Fee/mês | Comissão | Limpeza | Diferencial |
|-------|---------|----------|---------|-------------|
| Starter | €0 | 22% | €70/saída | Base — sem manutenção |
| Basic | €89 | 20% | €60/saída | Manutenção preventiva mensal |
| Mid | €159 | 17% | €45 ou incluída ≥5n | AI pricing + Smart Lock |
| Premium | €269 | 13% | €35 ou incluída ≥3n | Fiscal completo, NRU, resposta 4h |

## Remuneração do Manager

Componente recorrente (mensal, só sobre receita **efectivamente cobrada**):
- 15% da mensalidade do cliente (€0 no Starter — incentivo a upsell)
- 3% do gross rental líquido

Bónus carteira (mensal, cumulativo — aplica-se o maior escalão):
- 10+ props Basic+: +€150 · 20+: +€400 · 30+: +€750

Bónus aquisição (one-time, pago no **2º mês** após activação):
- Basic €50 · Mid €100 · Premium €150

Ciclo: HM paga ao Manager até **dia 10 do mês seguinte**.

## Crew — Ciclo de Tarefas

```
Checkout confirmado → Plataforma cria tarefa (urgência pela janela até próximo check-in)
    → Chamamento por score (30min para confirmar)
    → Crew recebe Smart Lock code → Executa + fotos obrigatórias
    → Captain aprova (ou auto-aprova se Elite)
    → Proprietário notificado: "Casa pronta ✅"
    → Payout na quarta seguinte (Stripe Connect + Statement Resend)
```

Task statuses: `PENDING → NOTIFIED → CONFIRMED → IN_PROGRESS → SUBMITTED → APPROVED → REJECTED → REDISTRIBUTED`

## Crew Score

| Acção | Pontos |
|---|---|
| Tarefa no prazo | +10 |
| Validada sem reparos | +15 |
| Avaliação positiva proprietário | +20 |
| Disponibilidade pico (sex/sáb) | +5 |
| Não aceite s/ justificação | -20 |
| Aceite mas não completada | -30 |
| Reclamação documentada | -40 |
| Dano não reportado | -50 |

Níveis: Suspenso (0-49) · Básico (50-149) · Verificado (150-299, +5%) · Expert (300-499, +10%) · Elite (500+, +15%, inspecções independentes)

## Property Lifecycle

```
PENDING_CLIENT → PENDING_APPROVAL → CONTRACT_PENDING → ACTIVE
```

Pré-requisitos para approval: ≥1 foto + house rules + **Smart Lock instalado**.

## Smart Lock

Obrigatório no onboarding. Código temporário por tarefa, válido apenas na janela. Log de entradas visível no portal do Client.

## Regras importantes

- **Moeda**: base EUR. `useCurrency()` só display — nunca em inputs (usar `fmtEUR` fixo).
- **subscriptionPlan**: não está na sessão NextAuth — sempre ler da DB.
- **Comissões**: nunca hardcodar — usar `PLAN_COMMISSION` e `calcCommission` de `src/lib/finance.ts`.
- **Invoices auto-gerados**: `isAutoGenerated = true` — não contam como receita HM.
- **Migrations**: criar ficheiro SQL em `prisma/migrations/` com timestamp.
- **House rules**: só keys da constante `HOUSE_RULES`, nunca texto livre.
- **Qualidade**: garantida pelo sistema (checklists + fotos + Captain), não pelo Manager.
- **Crew submete fotos obrigatórias**: sem submissão → sem pagamento.
- **Manager nunca contacta Crew**: passa sempre pelo Captain.
- **Idioma do user**: definido no Step 0 do onboarding wizard, propaga para emails, invoices, contratos, AI.

## Modelos Prisma a implementar

```prisma
CrewPropertyRelationship { crewId, propertyId, totalTasks, propertyTrustScore, ownerApproved, captainEndorsed, incidentCount, aiRiskLevel, aiAlertActive }
CrewScore { crewId, currentScore, level, history[] }
CrewPayout { crewId, weekStart, weekEnd, tasks[], totalAmount, status, stripeTransferId, statementSentAt }
CrewIntervention { taskId, managerId, reason, status, resolvedBy }
```

## Ficheiros críticos

| Ficheiro | O que faz |
|----------|-----------|
| `src/lib/finance.ts` | Comissões, payout dates por plataforma |
| `src/lib/house-rules.ts` | 34 regras pré-definidas, getRulesByCategory() |
| `src/app/api/payouts/[id]/route.ts` | Mark Paid → invoice auto + 2 emails |
| `src/app/api/properties/[id]/approve/route.ts` | Approve → CONTRACT_PENDING |
| `src/app/api/contracts/[id]/sign/route.ts` | Cliente assina → property activa |
| `src/app/api/cron/ai-monitor/route.ts` | 21 checks + AI analysis + self-healing |
| `src/lib/ai-monitor/checks.ts` | Definição dos checks |
| `prisma/schema.prisma` | Modelo de dados completo |
| `src/__tests__/finance.test.ts` | 27+ unit tests |

## Legislação Crítica (2025)

- **NRU/NRA** obrigatório desde 1 Jul 2025 — HM trata como serviço Premium
- **Modelo 179** trimestral, **IRNR Modelo 210** trimestral
- **VUT**, **NIE**, **Certificado Energético**, **Representante Fiscal** (não-UE)
- **Registo viajeiros (SES)** obrigatório

## Marketing — Foco Actual

Fase 1 (agora): **Crew + Managers primeiro**, proprietários depois.
Landing page: topo para proprietários. Secção discreta "Work with us" → `/careers` (Manager recruitment + Crew).

## Go-to-Market Verão 2025

1. **Mai/Jun**: Yuri como Manager-piloto (3-5 props via rede pessoal)
2. **Jul**: Primeiro Manager externo (dados reais das props piloto)
3. **Ago/Set**: 2-3 Managers activos, 10-15 propriedades

## Contexto de produto

Para perguntas sobre funcionalidades, roadmap ou decisões estratégicas:

```
/hm <pergunta>
```
