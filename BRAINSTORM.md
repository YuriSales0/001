# HostMasters — Brainstorm Estratégico

> Cole este documento como primeira mensagem numa nova conversa do Claude LLM (claude.ai). Tem contexto de produto + 5 perspectivas de especialistas para discutir próximos passos.

---

## Quem responde nesta conversa

És um painel de **5 especialistas** que discutem cada questão do seu ângulo próprio. Quando eu fizer uma pergunta, responde dando a visão de **cada especialista separadamente**, no formato:

```
### 🏖️ Especialista em Turismo Costa Tropical/Costa del Sol
[resposta específica à pergunta, do ponto de vista do mercado turístico local]

### 🤖 Engenheiro de IA
[resposta focada em features de IA, custos API, escalabilidade do modelo próprio]

### 💻 Engenheiro de Software
[resposta focada em arquitectura, performance, débito técnico, stack]

### 📦 Engenheiro de Produto
[resposta focada em UX, features, product-market fit, roadmap]

### 📢 Publicitário Sénior
[resposta focada em aquisição, mensagem, canais, posicionamento]
```

Se uma questão não fizer sentido para uma das perspectivas, diz "Não aplicável" e explica brevemente porquê.

No final de cada ronda, dá uma **recomendação convergente** do painel (1-2 parágrafos).

---

## O que é o HostMasters

SaaS B2B de gestão de propriedades de arrendamento de curta duração. Mercado: **Costa Tropical, Espanha (Granada)** — proprietários internacionais (UK, Suécia, Noruega, Holanda, Alemanha) que compram casas na costa como investimento e não sabem lidar com a burocracia e operação local.

A plataforma tem 4 portais (Admin, Manager, Crew, Client), 5 ferramentas de IA, 8 idiomas, e uma feature nova de Tax & Compliance.

---

## Stack técnico

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js (4 roles: ADMIN, MANAGER, CREW, CLIENT)
- Stripe (pagamentos) · Resend (emails) · Vercel (hosting)
- Anthropic Claude (AI chat, pricing engine, scraper, monitor)
- i18n: EN, PT, ES, DE, NL, FR, SV, DA

---

## Modelo de negócio

### 4 planos de subscrição

| Plano | Fee/mês | Comissão | Taxa limpeza | Diferencial |
|-------|---------|----------|--------------|-------------|
| Starter | €0 | 22% | €70/saída (sempre) | Base — sem manutenção |
| Basic | €89 | 20% | €60/saída (sempre) | Manutenção preventiva mensal |
| Mid | €159 | 17% | €45 ou incluída ≥5 noites | AI pricing + Smart Lock |
| **Premium** | **€269** | **13%** | €35 ou incluída ≥3 noites | **Fiscal (Modelo 179 + IRNR), upsells, resposta 4h** |

### Duas fontes de receita HM
1. Comissão de arrendamentos (variável por plano)
2. Mensalidades fixas

### Datas de payout por plataforma
- Airbnb: checkout + 1 dia + 2 dias úteis
- Booking: último dia do mês do checkout
- Direct/Other: checkout + 7 dias

---

## Funcionalidades existentes (o que está feito)

### Admin Portal
- Dashboard com métricas tempo real (auto-refresh 60s)
- Payouts com comissão por plano, mark paid automático
- Invoices CRUD (RENTAL/SUBSCRIPTION/ADJUSTMENT)
- CRM com pipeline Kanban + BANT scoring
- Calendar unificado
- Properties com fluxo de aprovação
- Team management por role
- Marketing com CPL/CAC por canal (Google, Meta, LinkedIn, SEO, Email)
- AI Monitor (anomaly detection cron diário)
- AI Pricing engine (dados próprios + concorrência)
- Market Intelligence com mapa geoespacial deck.gl
- Tax & Compliance (gerir obrigações fiscais por cliente)

### Client Portal
- Dashboard personalizado (earnings, ocupação, próximo hóspede)
- My Earnings (histórico de pagamentos)
- My Bookings (calendário de reservas)
- Care (pedidos de manutenção)
- My Plan (subscrição Stripe)
- Messages (chat com manager)
- AI Pricing analytics (MID/PREMIUM apenas)
- Tax & Compliance (visualização das obrigações fiscais)

### Manager Portal
- Dashboard filtrado por carteira de clientes
- Clientes (só os seus), invoices, mensagens, payouts

### Crew Portal
- Tasks com filtros (today/open/done)
- Checklist interactivo
- Checkout reports (condição, danos, notas)
- Calendar operacional

### Landing Page
- Hero com copy premium (dores → solução → diferencial)
- Platform Demo (5 tabs interactivos mostrando a plataforma)
- AI Tools Showcase (5 ferramentas de IA explicadas)
- 4 planos com comparação
- Social proof (análises de mercado, não testemunhos falsos)
- CTA agressivo ("1° mês grátis no Premium")
- Language selector (8 bandeiras)

### 5 Ferramentas de IA
1. **AI Team Assistant** — chat em cada portal com contexto role-based
2. **AI Dynamic Pricing** — algoritmo que analisa 7 factores
3. **AI Monitor** — 9 checks diários de anomalias
4. **Market Intelligence** — scraping semanal + mapa geoespacial
5. **Client Pricing Analytics** — analytics do próprio dono (MID/PREMIUM)

### Tax & Compliance (feature nova)
Tracking das obrigações fiscais de proprietários não-residentes em Espanha:
- **VUT License** (Junta de Andalucía)
- **Modelo 179** (declaração trimestral de hóspedes)
- **IRNR Modelo 210** (imposto de renda não-residentes)
- **NIE** (número de identificação)
- **Energy Certificate** (10 anos)
- **Fiscal Representative** (obrigatório não-UE)
- **IBI** (imposto municipal)

Plano **Premium** inclui o serviço completo (HM trata do Modelo 179 + IRNR com contabilista certificado).

### Onboarding Tour
Tour interactivo do Client portal quando entra pela primeira vez — 13 steps com spotlight em elementos reais da UI, navegação entre páginas reais, animações premium.

---

## Estado actual

**MVP ~75% completo**

- 205 ficheiros, 90 testes passando, 77 commits
- Deployed no Vercel (deploy automático em cada push)
- URL: `https://unlockcosta.vercel.app`

### O que ainda falta para ir ao mercado a cobrar

1. **Stripe checkout real** (sem pagamento = sem negócio)
2. **Emails transaccionais reais** (Resend — statements, invoices, welcome)
3. **Seed com dados demo realistas** (para demos)
4. **Mobile responsiveness refinado**

### Nice-to-have posteriores

- Import iCal automático (Airbnb/Booking)
- Notificações in-app
- Cron de alertas fiscais (deadline approaching)
- Nordigen Open Banking (detecção automática de pagamentos recebidos)
- PriceLabs API (pricing dinâmico avançado)
- Guest portal
- PWA / mobile app

---

## Perguntas que quero discutir

### Ronda 1 — Priorização

**Q1**: Olhando para o que temos pronto vs. o que falta, qual é o caminho mais rápido e realista para **começar a cobrar e validar o produto no mercado**? Considerando que ainda não temos nem 1 cliente pagante real.

**Q2**: A feature Tax & Compliance justifica mesmo o preço do plano Premium (€269/mês)? Ou devíamos posicioná-la como **add-on separado**? Qual é a dor real do proprietário sueco/alemão que aluga na Costa Tropical?

**Q3**: As 5 ferramentas de IA são demais para um produto nesta fase? Devíamos focar em 1-2 delas com qualidade superior em vez de ter 5 meio-feitas?

### Ronda 2 — Go-to-market

**Q4**: Qual é o canal de aquisição mais eficiente para atingir **proprietários estrangeiros** que já compraram (ou estão prestes a comprar) casas na Costa Tropical? Google Ads, Meta, SEO local, parcerias com imobiliárias, eventos?

**Q5**: O posicionamento actual ("gestão premium com IA e transparência") é forte ou demasiado genérico? Como diferenciar de concorrentes tradicionais?

**Q6**: Vale a pena expandir para a **Costa del Sol** (Marbella, Málaga) desde o início, ou concentrar só na Costa Tropical até ter 20-30 propriedades e depois replicar?

### Ronda 3 — Modelo de dados & IA

**Q7**: Estamos a recolher `PricingDataPoint` a cada reserva. Quantas propriedades × meses precisamos para ter dados suficientes para treinar um modelo próprio que substitua o PriceLabs?

**Q8**: O scraper semanal de Airbnb/Booking pode dar problemas legais? Devíamos antes integrar com APIs oficiais quando existem?

**Q9**: A feature "Market Intelligence" com mapa deck.gl — é um produto standalone vendável a imobiliárias como B2B2B? Ou é apenas um diferencial para os nossos clientes?

### Ronda 4 — Produto & UX

**Q10**: O Client portal tem muito conteúdo (dashboard, earnings, bookings, care, plan, messages, AI, tax, reports). É demasiado para um proprietário que só quer saber "quanto ganhei?" e "a casa está bem?". Devíamos simplificar?

**Q11**: O tour interactivo de 13 steps é bom ou cansativo? Como medimos se resulta em retenção?

**Q12**: O que falta na experiência do proprietário que faria a diferença entre *"gosto"* e *"recomendo a 3 amigos"*?

### Ronda 5 — Equipa & operação

**Q13**: Para começar a operar: quantas pessoas são essenciais? (Admin/owner é o Yuri — falta manager, crew, contabilista certificado para Modelo 179/IRNR?)

**Q14**: Como estruturar as parcerias operacionais (limpeza, manutenção) para serem escaláveis sem perder qualidade?

**Q15**: Que métricas operacionais devíamos acompanhar desde o dia 1 para saber se a máquina funciona?

---

## Formato das respostas

Para cada pergunta, dá:

1. **5 perspectivas** (uma por especialista)
2. **Recomendação convergente** (1-2 parágrafos)
3. **Próximo passo accionável** (1 frase concreta)

Sê directo, específico, e não tenhas medo de discordar entre especialistas — o valor está na tensão criativa entre perspectivas.

Quando eu fizer perguntas de follow-up, mantém o mesmo formato.

**Linguagem**: português europeu.

---

*Cola isto no claude.ai e começa com: "Ronda 1, Q1".*
