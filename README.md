# Quadra Web

Frontend web do Quadra, uma plataforma para organizar e acompanhar competições de basquete. O sistema concentra em um único ambiente as equipes, atletas, campeonatos, partidas e informações esportivas de uma organização, oferecendo uma visão clara da evolução de cada competição e do desempenho de seus participantes.

## Funcionalidades

O Quadra acompanha o ciclo completo de uma competição: da organização das temporadas, categorias, equipes e elencos até o registro dos jogos, resultados e estatísticas. A navegação foi estruturada para que seja possível sair de uma visão geral do campeonato e chegar rapidamente aos detalhes de uma equipe, atleta ou partida.

As principais telas e informações disponíveis são:

- **Início:** apresenta o contexto da organização e o ponto de entrada para as áreas esportivas do sistema.
- **Equipes:** lista as equipes da organização, seus status e vínculos, permitindo consultar quais grupos e participantes estão disponíveis para as competições.
- **Atletas:** exibe o perfil esportivo de cada atleta, com resumo de carreira, totais, médias, aproveitamento, histórico de partidas e participação em campeonatos.
- **Temporadas e categorias:** organiza o calendário esportivo e as categorias usadas para agrupar os campeonatos.
- **Campeonatos:** permite consultar competições por temporada e status, visualizar suas equipes inscritas e acompanhar a situação geral de cada torneio.
- **Detalhes do campeonato:** reúne uma visão geral com grupos, chaveamento, líderes, partidas recentes e regulamento, além de abas específicas para equipes, partidas, grupos, classificação, estatísticas e chaveamento.
- **Partidas:** apresenta a agenda e o histórico de jogos, com filtros por campeonato, equipe e status.
- **Detalhes da partida:** mostra as equipes, placar, data, horário, local, fase da competição, resultado por período, destaques e estatísticas individuais no box score.
- **Súmula:** registra ou atualiza o resultado da partida, o placar por período e os eventos necessários para manter o histórico esportivo da competição.

Com essas telas, o sistema permite acompanhar a composição dos campeonatos, a evolução das equipes na classificação e no chaveamento, os resultados de cada rodada e o desempenho individual dos atletas ao longo da temporada.

## Stack

- React 19 e TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- CSS Modules e Quadra Design System
- Vitest e Testing Library

## Requisitos

- Node.js 22 ou superior
- npm
- API do Quadra em execução

## Desenvolvimento local

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Crie um arquivo `.env.local` na raiz do projeto:

   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   A aplicação ficará disponível em `http://localhost:5173`.

## Scripts

```bash
npm run dev       # inicia o servidor de desenvolvimento
npm run build     # executa a verificação de tipos e gera o build de produção
npm run lint      # verifica o código com ESLint
npm test          # executa os testes
npm run preview   # serve o build de produção localmente
```

## Docker

Para executar o ambiente de desenvolvimento com Docker Compose:

```bash
docker compose up --build
```

## Estrutura principal

```text
src/
├── components/      # componentes reutilizáveis e shell da aplicação
├── contexts/        # estado global, incluindo autenticação
├── design-system/   # tokens e estilos do Quadra DS
├── features/        # funcionalidades organizadas por domínio
├── pages/           # telas e fluxos de navegação
├── services/        # integração com a API
└── router.tsx       # rotas da aplicação
```
