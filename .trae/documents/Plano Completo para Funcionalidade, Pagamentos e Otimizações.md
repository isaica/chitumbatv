## Objetivos
- Garantir que todas as páginas e ações estejam funcionais e intuitivas.
- Melhorar desempenho no frontend, mantendo dados mockados por enquanto.
- Implementar pagamento rápido em Mensalidades, com botão dedicado e fluxo consistente.
- Adicionar persistência no navegador sem comprometer futura integração com Supabase.

## Diagnóstico e Pontos de Atenção
- Roteamento/Autenticação: `src/App.tsx:21–40` protege rotas via `AuthContext` e exibe `Login` sem usuário.
- Clientes: CRUD, filtros avançados e cálculo de status ok, mas componente é monolítico e pesado; pagamento rápido via modal já funcional.
  - Referências: `src/pages/Clientes.tsx:159–210` (submit), `src/pages/Clientes.tsx:240–285` (pagamento rápido), `src/utils/paymentStatus.ts:11–100`.
- Mensalidades: lista, filtros e “Marcar como pago” ok; registro rápido importado (`QuickPaymentModal`), mas faltava integração na página.
  - Referências: `src/pages/Mensalidades.tsx:65–76` (marcar pago), `src/pages/Mensalidades.tsx:78–123` (pagamento com virtuais), `src/components/ui/quick-payment-modal.tsx` (modal).
- Lovable/shadcn: tooling de desenvolvimento e metadados do Lovable ainda presentes; revisar para ambiente de produção.

## Melhorias de UX/Funcionalidade
- Mensalidades:
  - Adicionar botão global “Registrar Pagamento” no topo (ao lado do título) que abre um seletor de cliente e, em seguida, o `QuickPaymentModal` com dados desse cliente.
  - Manter também botão “Registrar Pagamento” por linha para acesso direto.
- Clientes:
  - Ações em lote (lembrar, exportar) já existem; adicionar “Suspender/Reativar” com confirmação.
  - Gerar recibo PDF após pagamento com `jspdf` para testes.
- Busca Global:
  - Melhorar resultado com destaque de status e ação direta “Registrar Pagamento” (abre modal com cliente selecionado).

## Persistência no Navegador (sem backend)
- Introduzir serviço de armazenamento tipado:
  - Arquivo novo: `src/services/storage.ts` com API: `get<T>(key)`, `set<T>(key, value)`, `clear(key)`, versão de schema e migração simples.
  - Chaves: `clients_v1`, `mensalidades_v1`, `filiais_v1`, `usuarios_v1`, `activities_v1`, `metrics_v1`.
- Repositórios finos (interfaces): `ClientRepo`, `MensalidadeRepo`, etc., usando `storage.ts` internamente.
  - Futura integração com Supabase: implementar repos com mesma interface; trocar injeção sem quebrar páginas.
- Páginas carregam do storage e, se vazio, inicializam com mocks e persistem após primeira carga.

## Performance
- Memoizar listas filtradas e derivados:
  - Clientes: já memoiza status; adicionar memo para `filteredClients` e contadores rápidos.
  - Mensalidades: memo para `filteredMensalidades` (aplicar em produção).
- Virtualização:
  - Tabelas de Clientes/Mensalidades com `react-window` para listas grandes.
- Extrair lógicas repetidas:
  - Serviço `payments.ts` com helpers: gerar mensalidades virtuais, confirmar pagamentos (existentes/virtuais), cálculo de totais; usado por Clientes, Mensalidades e Dashboard.

## Organização do Código
- Componentizar páginas grandes:
  - Clientes: Toolbar, Table, RowActions, DetailsModal, PaymentModal em `src/components/clients/*`.
  - Mensalidades: Toolbar, Table, RowActions, GlobalPaymentButton/Selector em `src/components/mensalidades/*`.
- Hooks:
  - `useClientFilters`, `useMensalidadeFilters`, `usePayments`, `usePersistentState`.
- Tipos/Utils:
  - Manter `paymentStatus.ts` como única fonte de regras; documentar invariantes nos nomes das funções (sem comentários no código).

## Ajustes Lovable/shadcn
- `lovable-tagger`: manter apenas em `development`; proteger por env (`VITE_LOVABLE_ENABLED`) e desligar em produção.
- `index.html`: substituir metatags/OG/Twitter de `lovable.dev` por branding do projeto.
- shadcn: revisar tokens de cor/animações e remover componentes não utilizados.

## Verificação e Testes
- Fluxos principais:
  - Login mock, navegação, filtros, CRUD de clientes, pagamento rápido em Clientes e Mensalidades, exportações.
- Persistência:
  - Verificar leitura/escrita no `localStorage` e comportamento de migração.
- UI/Performance:
  - Medir re-renders em páginas com filtros; validar virtualização e memoização.
- Relatórios: conferir agregados com base nos dados persistidos.

## Fases de Implementação
1. Integração de Pagamento Rápido em Mensalidades
   - Botão global com seletor de cliente.
   - Botão por linha com `QuickPaymentModal` (reuso do existente).
2. Persistência no Navegador
   - Criar `storage.ts`, integrar em Clientes/Mensalidades/Filiais/Usuarios.
   - Persistir após qualquer mutação (criar/editar/excluir/pagar).
3. Serviço de Pagamentos
   - Extrair util compartilhado; ajustar páginas para chamar serviço único.
4. Otimizações de Performance
   - Memoizações adicionais e virtualização de tabelas.
5. Organização/Refatoração
   - Componentizar páginas grandes; criar hooks de filtros e pagamentos.
6. Ajustes Lovable/shadcn
   - Variáveis de ambiente, metadados e limpeza de componentes.
7. Testes e Validação Final
   - Exercitar todos os fluxos, revisar UX, corrigir eventuais erros.

## Confirmação
- Posso seguir com estas etapas e entregar as mudanças com persistência local, pagamento rápido em Mensalidades e melhorias de desempenho/UX, mantendo a integração futura com Supabase plugável?