# Fase 3 — Inscrição e elenco: integração `tcc-web` ↔ API real (design)

Data: 2026-07-26

Branch: `feature/phase-03-registration-roster-integration`

Base: `tcc-web/origin/dev` em `debf59e`
Pré-condição: Fase 3 do `tcc-api` mergeada em `origin/dev` no commit `6ad6a61`

## Contexto

O `tcc-web` já tem a tela de inscrição e elenco em
`TournamentDetailPage`, mas as operações ainda passam pelo store em memória
semeado em `src/services/sportsApi/index.ts`. A Fase 3 troca por HTTP:

- catálogos tenant-scoped de equipes e membros elegíveis;
- inscrições ativas de equipes;
- criação, seed e retirada reversível da inscrição;
- leitura, criação, edição e retirada reversível do elenco.

O handoff da API fornecido para esta fase é a fonte de verdade. A integração
não altera `tcc-api`, não implementa grupos, chaveamento, partidas ou
classificação e não marca a fase como concluída no roadmap antes do merge do
PR de frontend.

## Por que esta etapa exige uma spec

Não basta trocar `Promise.resolve(store.*)` por Axios:

1. o mock chama a identidade global de `athleteId`, mas a API e a regra de
   domínio usam `User.id`/`userId`;
2. o mock resolve nomes carregando todo o catálogo, mas o roster real já traz
   `displayNameSnapshot`;
3. camisa é obrigatória na UI atual, mas a API distingue omissão no `POST`
   (copiar a camisa da afiliação) de `null` explícito (gravar/limpar sem
   camisa);
4. equipes, membros elegíveis e inscrições são paginados;
5. o store de fases futuras ainda usa inscrições e roster sintéticos para
   grupos, chaveamento, súmula e classificação.

## Abordagens consideradas

### 1. Recomendada — modelos canônicos da API e mocks futuros isolados

Os read models da Fase 3 espelham os campos HTTP. O roster usa `userId` e
`displayNameSnapshot`; o catálogo elegível ganha um tipo próprio; os helpers
HTTP paginam; os consumidores deixam de carregar atletas para resolver nomes.
O estado sintético que ainda sustenta fases futuras permanece privado ao
store, sem ser exportado como implementação da Fase 3.

É a menor solução que não perpetua a identidade errada nem transforma o
adapter em uma camada de compatibilidade permanente.

### 2. Manter os tipos mockados e renomear no adapter

Mapear `userId → athleteId`, `teamId → currentTeamId` e
`jerseyNumber → number` reduziria o diff imediato. Foi descartado porque
mistura catálogo de elegibilidade com perfil esportivo, perde snapshots e
mantém uma coerção conceitual que o contrato §13 proíbe como modelo
permanente.

### 3. Reescrever agora todas as telas esportivas para os modelos reais

Também foi descartado. Partidas, grupos, chaveamento, classificação e
estatísticas ainda têm fases próprias. Esta etapa só remove da produção o
mock da fatia inscrição/elenco e faz os ajustes mínimos nos consumidores que
dependiam indevidamente do catálogo inteiro.

## Modelos canônicos

### `Team`

O catálogo mantém o modelo canônico mínimo já consumido pelas telas:

```ts
interface Team {
  id: number
  name: string
  shortName: string
  city?: string | null
}
```

`slug`, `state`, `status`, `createdAt` e `updatedAt` chegam no HTTP, mas nenhuma
tela desta fase os usa. Como nas integrações anteriores, propriedades extras
da resposta não são copiadas para o tipo até existir um consumidor.

Não existe `organizationId` no tipo nem na query. O tenant vem somente do JWT.
O fluxo antigo de administrador global continua intencionalmente sem suporte
até a Fase 11; `AdminTeamsPage` e `adminApi` não são migrados nesta etapa.

### `RosterCandidate`

`GET /athletes` é um catálogo de usuários elegíveis, não o detalhe esportivo
de um atleta:

```ts
interface RosterCandidate {
  id: number // User.id
  name: string
  teamId: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  jerseyNumber: number | null
}
```

O tipo mockado `Athlete`, ainda usado pelo detalhe de atleta de fases futuras,
não é reaproveitado. Nenhum email, id de afiliação ou `organizationId` é
inventado no frontend. `position` e `status` são ignorados porque o seletor não
os exibe.

### `TournamentTeam`

O modelo passa a incluir o lifecycle devolvido pela API:

```ts
interface TournamentTeam {
  id: number
  tournamentId: number
  teamId: number
  seed: number | null
  tiebreakOrder: number | null
  tiebreakBlockKey: string | null
  displayNameSnapshot: string
}
```

`tiebreakOrder` e `tiebreakBlockKey` permanecem somente leitura. A UI desta
fase não cria edição de seed; o adapter cobre `PATCH /tournament-teams/:id`
para completar a rota implementada, sem inventar uma tela que não existe.
`status`, `createdAt` e `updatedAt` ficam fora do tipo porque a consulta
operacional já filtra `ACTIVE` e nenhuma tela os apresenta.

### `TournamentRoster`

```ts
interface TournamentRoster {
  id: number
  tournamentId: number
  tournamentTeamId: number
  userId: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  jerseyNumber: number | null
  displayNameSnapshot: string
}
```

O componente mostra `displayNameSnapshot` diretamente. Não consulta o catálogo
para resolver membros já inscritos. `status` e timestamps são lifecycle
servidor-side sem consumidor nesta fase e permanecem fora do tipo.

## Adapter HTTP

Arquivos próprios mantêm `sportsApi/index.ts` como barrel:

- `catalogs.ts`: `listTeamsPage`, `searchTeams`, `listRosterCandidatesPage` e
  `searchRosterCandidates`;
- `tournament-teams.ts`: listagem ativa, criação, seed e retirada;
- `tournament-rosters.ts`: listagem, criação, edição e retirada.

Listagens de uso operacional sempre enviam
`GET /tournaments/:id/teams?status=ACTIVE`. Helpers usados por lookup seguem
as páginas até `meta.currentPage === meta.totalPages`; não presumem que os
primeiros 100 itens formam o catálogo inteiro.

Seletores reutilizam `SearchSelect` e pesquisam no servidor por `q`:

- inscrição: `GET /teams?status=ACTIVE&q=...`;
- elenco: `GET /athletes?teamId=...&role=...&q=...`.

Cada busca agrega todas as páginas daquele resultado antes de devolver as
opções. Não se adiciona dependência nem um segundo componente de seleção.

`DELETE` verifica o sucesso pelo status HTTP e retorna `Promise<void>` sem
tentar ler JSON. `POST`/`PATCH` extraem `data` do envelope. O adapter não
recalcula autorização, lifecycle, unicidade ou snapshots.

## Fluxo da tela

### Inscrição

O painel de inscrição continua exclusivo de `ORG_ADMIN`, como hoje. O
`Combobox` local vira `SearchSelect`; a opção selecionada carrega id e nome,
mas o request envia apenas `{ teamId }`. A resposta da API atualiza o cache de
inscrições e o detalhe do campeonato.

A lista e os nomes das equipes inscritas usam
`displayNameSnapshot`. O catálogo global só complementa `shortName` onde
outras abas ainda precisam desse campo.

### Elenco

O editor inline e o comportamento de abrir uma equipe por vez permanecem.
Ao abrir uma inscrição:

- `GET /tournament-teams/:id/tournament-rosters` carrega o roster;
- o nome vem do snapshot;
- a busca de novo membro é remota e filtrada pelo `teamId` global e pelo papel
  atualmente escolhido;
- trocar o papel limpa a pessoa selecionada, evitando enviar uma opção obtida
  com outro filtro.

No `POST`, campo de camisa vazio é omitido para a API copiar a camisa da
afiliação ativa. Um número digitado, inclusive `0`, é enviado diretamente.
No `PATCH`, limpar o campo envia `jerseyNumber: null`. Na tabela, `null` aparece
como `—`.

O frontend não tenta antecipar `ATHLETE_ALREADY_REGISTERED`,
`INVALID_ROSTER_MEMBER` ou `INVALID_ROSTER_ROLE`; mostra a mensagem específica
de acordo com `error.code`.

### Permissões

Leitura de inscrições permanece disponível a qualquer usuário autenticado por
meio da aba existente. A UI administrativa continua mostrando criação e
retirada de inscrição apenas para `ORG_ADMIN`.

Embora a API permita `TEAM_ADMIN` e `COACHING_STAFF` alterarem o roster da
própria equipe, `/auth/me` não expõe `teamId` nem uma capability pronta. O
contrato §13 proíbe rederivar autorização de afiliação bruta. Portanto esta
fase não expõe novos botões para esses papéis; o suporte de UI entra quando o
backend fornecer capability/contexto suficiente. A API continua sendo a
autoridade caso uma chamada seja feita.

## Estado, cache e transição entre fases

- inscrições são cacheadas por `tournamentId`, sempre com status ativo;
- roster é cacheado por `tournamentTeamId`; `tournamentId` pode permanecer nas
  variáveis de mutation apenas para invalidar o detalhe/contadores;
- criação/retirada de inscrição invalida lista, detalhe do campeonato,
  sugestão de campeão e consumidores esportivos dependentes;
- criação/edição/retirada de roster invalida somente o roster daquela
  inscrição.

O store em memória deixa de ser exportado para inscrição e elenco. Seus dados
sintéticos mínimos podem continuar privados porque fases futuras ainda usam o
motor mockado para classificação, chaveamento e resultado. Não há fallback do
HTTP para mock.

`getAllTournamentTeams`, necessário apenas pela listagem mockada de partidas
entre campeonatos, passa a compor as rotas reais por campeonato. Esse fan-out
é transitório e deve desaparecer quando a listagem de partidas for integrada;
não será criada uma rota inexistente nem um registro paralelo.

## Loading, vazio e erro

- o detalhe geral não bloqueia mais em um catálogo completo de atletas;
- o roster aberto mostra loading, erro com retry e vazio dentro da região
  inline;
- falha na busca remota fica no estado de erro já oferecido por
  `SearchSelect`;
- falhas de escrita ficam no alerta do painel correspondente;
- `204` remove imediatamente o item após a invalidação/refetch, sem resposta
  sintética.

Mapeamentos relevantes:

| Código | Mensagem de UI |
| --- | --- |
| `DUPLICATE_RECORD` na inscrição | Equipe já inscrita neste campeonato. |
| `INVALID_TEAM` | A equipe não está disponível para esta organização. |
| `ATHLETE_ALREADY_REGISTERED` | Atleta já está em outra equipe neste campeonato. |
| `INVALID_ROSTER_MEMBER` | A pessoa não possui vínculo ativo com esta equipe. |
| `INVALID_ROSTER_ROLE` | O papel escolhido não corresponde ao vínculo ativo. |
| `INACTIVE_REGISTRATION` | A inscrição ou o membro não está ativo. |
| `TOURNAMENT_NOT_MUTABLE` | Este campeonato não permite mais alterações. |
| `REGISTRATION_IN_USE` | A inscrição já está em uso pelo chaveamento. |

Demais erros usam fallback contextual. `403` não é reinterpretado como regra
de domínio no adapter.

## Testes

### Adapter

Vitest com Axios mockado no boundary já usado nas Fases 1–2:

- filtros, ids repetidos e envelopes paginados;
- paginação completa dos helpers de busca;
- `status=ACTIVE` obrigatório nas inscrições operacionais;
- payloads exatos, inclusive `userId`, omissão/null de camisa e seed somente
  leitura;
- `DELETE 204` sem leitura de body.

### Queries e componentes

- mutations invalidam a inscrição/roster corretos;
- roster renderiza snapshot sem catálogo;
- busca de membro usa `teamId` e papel atuais;
- camisa vazia no create é omitida, no update vira `null`;
- erros conhecidos são apresentados;
- loading/error/empty permanecem dentro do painel inline.

### Validação final

Executar testes focados, `npm run lint`, `npm run build` e a suíte Vitest
completa. O smoke autenticado com Playwright é opcional nesta fase porque o
banco local não oferece fixture estável e isolada para equipe/afiliação; se
executado manualmente, deve cobrir inscrição → roster → retirada → reativação,
confirmando preservação dos ids.

## Fora de escopo

- suporte funcional da rota global de administração de equipes antes da Fase
  11;
- UI de seed;
- edição de `tiebreakOrder`/`tiebreakBlockKey`;
- nova tela para gestores de equipe/comissão sem capability de equipe no
  bootstrap;
- integração real de grupos, chaveamento, partidas, classificação,
  estatísticas ou detalhe de atleta;
- alteração do roadmap antes do merge do PR de frontend.
