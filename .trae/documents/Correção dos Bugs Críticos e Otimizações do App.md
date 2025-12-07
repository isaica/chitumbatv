## Bugs Críticos e Causas
- Erro de datas: `TypeError: mensalidade.dueDate.toLocaleDateString is not a function` (Mensalidades)
  - Causa: objetos `Date` persistidos no `localStorage` voltam como strings; o código usa `toLocaleDateString` diretamente.
  - Locais: `src/pages/Mensalidades.tsx:351` (renderização de `dueDate`), `src/pages/Mensalidades.tsx:378–382` (exibe `paidAt`).
- Aviso de DOM: `validateDOMNesting(...): <div> cannot appear as a descendant of <p>` (QuickPaymentModal)
  - Causa: `Badge` (renderiza como `div`) inserido dentro de `<p>`.
  - Local: `src/components/ui/quick-payment-modal.tsx:44–55` (Badge dentro do `<p>` do título do mês).

## Correções Planeadas
### 1) Normalização de Datas ao Ler do Storage
- Criar util `reviveDates` por tipo (Mensalidade, Client, User, Activity), convertendo campos `dueDate`, `paidAt`, `createdAt`, `timestamp` para `Date`.
- Aplicar no carregamento inicial:
  - Mensalidades: mapear objetos ao inicializar estado (`src/pages/Mensalidades.tsx:19–34`).
  - Clientes: mapear `createdAt` e datas de mensalidades no estado local (`src/pages/Clientes.tsx:48–50`).
  - Usuários: mapear `createdAt` (`src/pages/Usuarios.tsx:39`).
- Opcional: evoluir `storage.loadOrInit` para aceitar um `reviver` e aplicar automaticamente.

### 2) Corrigir DOM Nesting no QuickPaymentModal
- Trocar `<p>` que contém o `Badge` por estrutura inline/`span` ou mover `Badge` para fora do `<p>`:
  - Alvo: `src/components/ui/quick-payment-modal.tsx:44–55`.
  - Nova estrutura: título do mês em `<div>` com `span` para texto e `Badge` como irmão.

### 3) Garantir Estabilidade em Usuários
- Já corrigido: `useEffect` para persistência posicionado dentro do componente (`src/pages/Usuarios.tsx:63–72`).
- Validar que `watch('role')` e `setValue` não disparam warnings; memoizar `filteredUsers` se necessário.
- Busca inclui telefone (`src/pages/Usuarios.tsx:63–77`).

## Melhorias Solicitadas
### 4) Recibo de Pagamento (PDF)
- Util pronto (`src/utils/receipt.ts`) com `jspdf` + `jspdf-autotable`.
- Aplicações:
  - Mensalidades: gerar recibo ao marcar como pago e adicionar botão “Recibo” em linhas pagas (`src/pages/Mensalidades.tsx:367–376, 378–382`).
  - Clientes: adicionar botão “Recibo” nas ações de pagamento confirmado.

### 5) Virtualização de Tabelas
- Implementar `VirtualTableBody` (sem dependências externas):
  - Mede altura de linha padrão (ex.: 56px), renderiza janela calculada por scroll.
  - Aplica em `src/pages/Clientes.tsx` e `src/pages/Mensalidades.tsx` dentro de `PaginationWrapper` para listas grandes.
- Alternativa futura: integrar `react-window` se aprovado.

## Outras Otimizações e Verificações
- Memoização já aplicada:
  - Mensalidades: `filteredMensalidades` (`src/pages/Mensalidades.tsx:50–51`).
  - Clientes: `filteredClients` (`src/pages/Clientes.tsx:92–123`).
- Terminologia local: “Inadimplente” → “Kilapeiro” em labels/filtros e Dashboard (`src/utils/paymentStatus.ts:126–141`, `src/pages/Dashboard.tsx:292, 341, 375`, `src/pages/Clientes.tsx:562`).
- Acesso por filial:
  - Clientes/Mensalidades: admin vê todos; gerente/funcionário apenas sua filial (`src/pages/Clientes.tsx:119–123`, `src/pages/Mensalidades.tsx:29–41, 48–51`).
  - Usuários: admin vê todos; demais apenas da própria filial (`src/pages/Usuarios.tsx:69–76`).
- Error Boundary (opcional): criar `src/components/ErrorBoundary.tsx` e envolver rotas em `App.tsx` para capturar erros.
- Tooling: manter `lovable-tagger` gated por `VITE_LOVABLE_ENABLED` em dev (`vite.config.ts:12–16`).

## Passos de Implementação
1. Adicionar `reviveDates` e aplicar em estados ao carregar do storage (Mensalidades, Clientes, Usuários).
2. Corrigir estrutura do `QuickPaymentModal` para evitar `Badge` dentro de `<p>`.
3. Revisar renderizações que usam datas (`toLocaleDateString`) e garantir `Date` válido.
4. Integrar botão “Recibo” em Clientes (linhas/ações de pagamento) além do já feito em Mensalidades.
5. Implementar `VirtualTableBody` e usar nas páginas com grande volume.
6. Adicionar `ErrorBoundary` simples e envolver `AppRoutes`.
7. Rodar testes manuais: navegar, filtrar, pagar (existente e virtual), gerar recibos, persistência e acesso por filial.

## Resultado Esperado
- Mensalidades e Clientes sem erro de datas; QuickPaymentModal sem warnings de DOM.
- Recibos gerados em PDF com dados do cliente/filial/período/valor.
- Tabelas fluídas com virtualização para grandes volumes.
- Persistência confiável e terminologia adequada (Kilapeiro).

## Confirmação
- Posso aplicar estas correções e melhorias agora e te entregar o app sem os erros, com recibos e tabelas otimizadas?