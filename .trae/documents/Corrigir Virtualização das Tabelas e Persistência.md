## Problema
- Warnings de DOM: `<tbody> div` e `<div> table` causados por `VirtualTableBody` renderizar um `<div>` dentro da `<table>`, quebrando a semântica.
- Cabeçalhos desalinhados: scroll interno dentro da `<table>` com `<div>` inserido.
- Persistência: datas vindas do storage como strings ainda provocavam erros em `Usuarios`.

## Solução Técnica
1) Reescrever `VirtualTableBody` para renderizar somente `<tbody>` (sem `<div>` interno):
- Aceitar `containerRef` (o wrapper scroll ficará fora da `<table>`).
- Manter linhas de padding (antes/depois) e janela visível calculada por scroll do `containerRef`.

2) Atualizar `Clientes` e `Mensalidades`:
- Criar um wrapper `<div ref={tableScrollRef} style={{ maxHeight: 520, overflowY: 'auto' }}>` que envolve a `<table>`.
- Passar `containerRef={tableScrollRef}` para `VirtualTableBody`.
- Preservar `TableHeader` dentro da `<table>` para alinhar colunas com o corpo.

3) Persistência e datas
- Reviver `createdAt` em `Usuarios` (já aplicado) e manter reviver de `Mensalidades` e `Clientes`.

## Verificação
- Abrir Clientes/Mensalidades e validar:
  - Sem warnings de DOM nesting.
  - Cabeçalho alinhado com corpo; scroll funciona.
  - Datas exibidas corretamente.

## Extras
- Manter `ErrorBoundary` já aplicado.
- Se necessário, ajustar alturas de linhas (`rowHeight`) para melhor precisão visual.

## Ação
- Implementar reescrita de `VirtualTableBody` e integrar nos dois pages com wrapper de scroll e `containerRef`.