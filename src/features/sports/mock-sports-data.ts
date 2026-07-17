/**
 * Sports domain — MOCK DATA (PUC Campinas Basquete demo).
 * Team slugs and athlete emails MUST match tcc-api/prisma/seeds/puc-dev-seed.sql
 */
import type { Athlete, AthleteMatchStatsRow, AthleteStatTotals, AthleteTournamentStatsRow, Match, MatchDetail, PeriodScore, PlayerMatchStats, Season, StatLeaders, Team, TeamMatchStats, Tournament, TournamentCategory } from './types'
import { aggregateAthleteStats } from './sportsUtils'

export const seedSeasons: Season[] = [
  { id: 'season-2025-26', label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
]

export const seedCategories: TournamentCategory[] = [
  { id: 'cat-sub19', name: 'Sub-19', sortOrder: 1 },
  { id: 'cat-adulto-masc', name: 'Adulto Masculino', sortOrder: 2 },
]
export const MOCK_TEAMS: Team[] = [
  { id: 'puc-time-1', name: 'Time 1', shortName: 'T01', city: 'Campinas' },
  { id: 'puc-time-2', name: 'Time 2', shortName: 'T02', city: 'Campinas' },
  { id: 'puc-time-3', name: 'Time 3', shortName: 'T03', city: 'Campinas' },
  { id: 'puc-time-4', name: 'Time 4', shortName: 'T04', city: 'Campinas' },
  { id: 'puc-time-5', name: 'Time 5', shortName: 'T05', city: 'Campinas' },
  { id: 'puc-time-6', name: 'Time 6', shortName: 'T06', city: 'Campinas' },
  { id: 'puc-time-7', name: 'Time 7', shortName: 'T07', city: 'Campinas' },
  { id: 'puc-time-8', name: 'Time 8', shortName: 'T08', city: 'Campinas' },
  { id: 'puc-time-9', name: 'Time 9', shortName: 'T09', city: 'Campinas' },
  { id: 'puc-time-10', name: 'Time 10', shortName: 'T10', city: 'Campinas' },
  { id: 'puc-time-11', name: 'Time 11', shortName: 'T11', city: 'Campinas' },
  { id: 'puc-time-12', name: 'Time 12', shortName: 'T12', city: 'Campinas' },
  { id: 'puc-time-13', name: 'Time 13', shortName: 'T13', city: 'Campinas' },
  { id: 'puc-time-14', name: 'Time 14', shortName: 'T14', city: 'Campinas' },
  { id: 'puc-time-15', name: 'Time 15', shortName: 'T15', city: 'Campinas' },
  { id: 'puc-time-16', name: 'Time 16', shortName: 'T16', city: 'Campinas' },
]
const PUC_ATHLETES: Athlete[] = [
  { id: 'rafael.moura@quadra.com.br', name: 'Rafael Moura', number: 4, position: 'PG', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'diego.santos@quadra.com.br', name: 'Diego Santos', number: 5, position: 'SG', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'felipe.oliveira@quadra.com.br', name: 'Felipe Oliveira', number: 6, position: 'SF', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'gabriel.costa@quadra.com.br', name: 'Gabriel Costa', number: 7, position: 'PF', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'henrique.lima@quadra.com.br', name: 'Henrique Lima', number: 8, position: 'C', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'igor.martins@quadra.com.br', name: 'Igor Martins', number: 9, position: 'PG', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'joao.pereira@quadra.com.br', name: 'João Pereira', number: 10, position: 'SG', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'lucas.rodrigues@quadra.com.br', name: 'Lucas Rodrigues', number: 11, position: 'SF', currentTeamId: 'puc-time-1', status: 'ACTIVE' },
  { id: 'nicolas.barbosa@quadra.com.br', name: 'Nicolas Barbosa', number: 4, position: 'PG', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'otavio.ribeiro@quadra.com.br', name: 'Otávio Ribeiro', number: 5, position: 'SG', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'paulo.carvalho@quadra.com.br', name: 'Paulo Carvalho', number: 6, position: 'SF', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'pedro.gomes@quadra.com.br', name: 'Pedro Gomes', number: 7, position: 'PF', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'ricardo.araujo@quadra.com.br', name: 'Ricardo Araujo', number: 8, position: 'C', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'roberto.nunes@quadra.com.br', name: 'Roberto Nunes', number: 9, position: 'PG', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'rodrigo.melo@quadra.com.br', name: 'Rodrigo Melo', number: 10, position: 'SG', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'samuel.castro@quadra.com.br', name: 'Samuel Castro', number: 11, position: 'SF', currentTeamId: 'puc-time-2', status: 'ACTIVE' },
  { id: 'vitor.campos@quadra.com.br', name: 'Vitor Campos', number: 4, position: 'PG', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'wesley.cardoso@quadra.com.br', name: 'Wesley Cardoso', number: 5, position: 'SG', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'andre.teixeira@quadra.com.br', name: 'André Teixeira', number: 6, position: 'SF', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'antonio.monteiro@quadra.com.br', name: 'Antonio Monteiro', number: 7, position: 'PF', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'bernardo.pinto@quadra.com.br', name: 'Bernardo Pinto', number: 8, position: 'C', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'caio.moreira@quadra.com.br', name: 'Caio Moreira', number: 9, position: 'PG', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'cesar.correia@quadra.com.br', name: 'César Correia', number: 10, position: 'SG', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'daniel.azevedo@quadra.com.br', name: 'Daniel Azevedo', number: 11, position: 'SF', currentTeamId: 'puc-time-3', status: 'ACTIVE' },
  { id: 'fabio.ramos@quadra.com.br', name: 'Fábio Ramos', number: 4, position: 'PG', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'fernando.lopes@quadra.com.br', name: 'Fernando Lopes', number: 5, position: 'SG', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'francisco.mendes@quadra.com.br', name: 'Francisco Mendes', number: 6, position: 'SF', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'giovani.fernandes@quadra.com.br', name: 'Giovani Fernandes', number: 7, position: 'PF', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'guilherme.batista@quadra.com.br', name: 'Guilherme Batista', number: 8, position: 'C', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'gustavo.cavalcanti@quadra.com.br', name: 'Gustavo Cavalcanti', number: 9, position: 'PG', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'heitor.miranda@quadra.com.br', name: 'Heitor Miranda', number: 10, position: 'SG', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'hugo.xavier@quadra.com.br', name: 'Hugo Xavier', number: 11, position: 'SF', currentTeamId: 'puc-time-4', status: 'ACTIVE' },
  { id: 'leandro.rezende@quadra.com.br', name: 'Leandro Rezende', number: 4, position: 'PG', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'leonardo.barros@quadra.com.br', name: 'Leonardo Barros', number: 5, position: 'SG', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'luan.farias@quadra.com.br', name: 'Luan Farias', number: 6, position: 'SF', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'luiz.andrade@quadra.com.br', name: 'Luiz Andrade', number: 7, position: 'PF', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'marcelo.borges@quadra.com.br', name: 'Marcelo Borges', number: 8, position: 'C', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'mauricio.tavares@quadra.com.br', name: 'Mauricio Tavares', number: 9, position: 'PG', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'murilo.pacheco@quadra.com.br', name: 'Murilo Pacheco', number: 10, position: 'SG', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'nelson.cruz@quadra.com.br', name: 'Nelson Cruz', number: 11, position: 'SF', currentTeamId: 'puc-time-5', status: 'ACTIVE' },
  { id: 'rafael.coelho@quadra.com.br', name: 'Rafael Coelho', number: 4, position: 'PG', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'renato.macedo@quadra.com.br', name: 'Renato Macedo', number: 5, position: 'SG', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'renan.paiva@quadra.com.br', name: 'Renan Paiva', number: 6, position: 'SF', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'renato.campos@quadra.com.br', name: 'Renato Campos', number: 7, position: 'PF', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'ricardo.fonseca@quadra.com.br', name: 'Ricardo Fonseca', number: 8, position: 'C', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'robson.freire@quadra.com.br', name: 'Robson Freire', number: 9, position: 'PG', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'rogerio.santana@quadra.com.br', name: 'Rogerio Santana', number: 10, position: 'SG', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'ronaldo.matos@quadra.com.br', name: 'Ronaldo Matos', number: 11, position: 'SF', currentTeamId: 'puc-time-6', status: 'ACTIVE' },
  { id: 'sergio.moura@quadra.com.br', name: 'Sergio Moura', number: 4, position: 'PG', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'silvio.brandao@quadra.com.br', name: 'Silvio Brandao', number: 5, position: 'SG', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'tadeu.prado@quadra.com.br', name: 'Tadeu Prado', number: 6, position: 'SF', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'tales.guimaraes@quadra.com.br', name: 'Tales Guimaraes', number: 7, position: 'PF', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'tulio.ramires@quadra.com.br', name: 'Túlio Ramires', number: 8, position: 'C', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'valter.sales@quadra.com.br', name: 'Valter Sales', number: 9, position: 'PG', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'victor.alves@quadra.com.br', name: 'Victor Alves', number: 10, position: 'SG', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'vinicius.torres@quadra.com.br', name: 'Vinicius Torres', number: 11, position: 'SF', currentTeamId: 'puc-time-7', status: 'ACTIVE' },
  { id: 'william.dantas@quadra.com.br', name: 'William Dantas', number: 4, position: 'PG', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'yuri.leal@quadra.com.br', name: 'Yuri Leal', number: 5, position: 'SG', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'alex.santos@quadra.com.br', name: 'Alex Santos', number: 6, position: 'SF', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'alexandre.lemos@quadra.com.br', name: 'Alexandre Lemos', number: 7, position: 'PF', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'alisson.neto@quadra.com.br', name: 'Alisson Neto', number: 8, position: 'C', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'arthur.mota@quadra.com.br', name: 'Arthur Mota', number: 9, position: 'PG', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'augusto.cesar@quadra.com.br', name: 'Augusto César', number: 10, position: 'SG', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'benicio.rocha@quadra.com.br', name: 'Benicio Rocha', number: 11, position: 'SF', currentTeamId: 'puc-time-8', status: 'ACTIVE' },
  { id: 'claudio.barbosa@quadra.com.br', name: 'Claudio Barbosa', number: 4, position: 'PG', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'cleber.amaral@quadra.com.br', name: 'Cleber Amaral', number: 5, position: 'SG', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'cristiano.bittencourt@quadra.com.br', name: 'Cristiano Bittencourt', number: 6, position: 'SF', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'davi.cordeiro@quadra.com.br', name: 'Davi Cordeiro', number: 7, position: 'PF', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'denis.figueiredo@quadra.com.br', name: 'Denis Figueiredo', number: 8, position: 'C', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'douglas.henrique@quadra.com.br', name: 'Douglas Henrique', number: 9, position: 'PG', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'edson.junqueira@quadra.com.br', name: 'Edson Junqueira', number: 10, position: 'SG', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'elias.marques@quadra.com.br', name: 'Elias Marques', number: 11, position: 'SF', currentTeamId: 'puc-time-9', status: 'ACTIVE' },
  { id: 'everton.trindade@quadra.com.br', name: 'Everton Trindade', number: 4, position: 'PG', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'fabiano.uchoa@quadra.com.br', name: 'Fabiano Uchoa', number: 5, position: 'SG', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'felipe.valente@quadra.com.br', name: 'Felipe Valente', number: 6, position: 'SF', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'filipe.ximenes@quadra.com.br', name: 'Filipe Ximenes', number: 7, position: 'PF', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'flavio.zanetti@quadra.com.br', name: 'Flavio Zanetti', number: 8, position: 'C', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'frederico.abreu@quadra.com.br', name: 'Frederico Abreu', number: 9, position: 'PG', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'geovane.aguiar@quadra.com.br', name: 'Geovane Aguiar', number: 10, position: 'SG', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'gilberto.assis@quadra.com.br', name: 'Gilberto Assis', number: 11, position: 'SF', currentTeamId: 'puc-time-10', status: 'ACTIVE' },
  { id: 'helio.domingues@quadra.com.br', name: 'Helio Domingues', number: 4, position: 'PG', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'humberto.esteves@quadra.com.br', name: 'Humberto Esteves', number: 5, position: 'SG', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'isaac.franco@quadra.com.br', name: 'Isaac Franco', number: 6, position: 'SF', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'italo.garcia@quadra.com.br', name: 'Italo Garcia', number: 7, position: 'PF', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'jaime.henrique@quadra.com.br', name: 'Jaime Henrique', number: 8, position: 'C', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'jefferson.ibrahim@quadra.com.br', name: 'Jefferson Ibrahim', number: 9, position: 'PG', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'jeferson.jacinto@quadra.com.br', name: 'Jeferson Jacinto', number: 10, position: 'SG', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'jonas.klein@quadra.com.br', name: 'Jonas Klein', number: 11, position: 'SF', currentTeamId: 'puc-time-11', status: 'ACTIVE' },
  { id: 'juliano.nobrega@quadra.com.br', name: 'Juliano Nobrega', number: 4, position: 'PG', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'junior.ortega@quadra.com.br', name: 'Junior Ortega', number: 5, position: 'SG', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'kauan.padilha@quadra.com.br', name: 'Kauan Padilha', number: 6, position: 'SF', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'kelvin.quintana@quadra.com.br', name: 'Kelvin Quintana', number: 7, position: 'PF', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'kevin.rangel@quadra.com.br', name: 'Kevin Rangel', number: 8, position: 'C', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'kleber.siqueira@quadra.com.br', name: 'Kleber Siqueira', number: 9, position: 'PG', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'laercio.toledo@quadra.com.br', name: 'Laercio Toledo', number: 10, position: 'SG', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'lauro.umbelino@quadra.com.br', name: 'Lauro Umbelino', number: 11, position: 'SF', currentTeamId: 'puc-time-12', status: 'ACTIVE' },
  { id: 'lincoln.xavier@quadra.com.br', name: 'Lincoln Xavier', number: 4, position: 'PG', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'lorenzo.yamada@quadra.com.br', name: 'Lorenzo Yamada', number: 5, position: 'SG', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'luciano.zambelli@quadra.com.br', name: 'Luciano Zambelli', number: 6, position: 'SF', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'luiz.abrahao@quadra.com.br', name: 'Luiz Abrahao', number: 7, position: 'PF', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'manoel.bastos@quadra.com.br', name: 'Manoel Bastos', number: 8, position: 'C', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'marcio.coutinho@quadra.com.br', name: 'Marcio Coutinho', number: 9, position: 'PG', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'mario.dourado@quadra.com.br', name: 'Mario Dourado', number: 10, position: 'SG', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'matheus.espindola@quadra.com.br', name: 'Matheus Espindola', number: 11, position: 'SF', currentTeamId: 'puc-time-13', status: 'ACTIVE' },
  { id: 'milton.holanda@quadra.com.br', name: 'Milton Holanda', number: 4, position: 'PG', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'moises.ito@quadra.com.br', name: 'Moises Ito', number: 5, position: 'SG', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'natan.jardim@quadra.com.br', name: 'Natan Jardim', number: 6, position: 'SF', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'nilton.kruger@quadra.com.br', name: 'Nilton Kruger', number: 7, position: 'PF', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'norberto.lobato@quadra.com.br', name: 'Norberto Lobato', number: 8, position: 'C', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'odair.macedo@quadra.com.br', name: 'Odair Macedo', number: 9, position: 'PG', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'osmar.nogueira@quadra.com.br', name: 'Osmar Nogueira', number: 10, position: 'SG', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'osvaldo.oliveira@quadra.com.br', name: 'Osvaldo Oliveira', number: 11, position: 'SF', currentTeamId: 'puc-time-14', status: 'ACTIVE' },
  { id: 'plinio.ribeiro@quadra.com.br', name: 'Plinio Ribeiro', number: 4, position: 'PG', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'quirino.saldanha@quadra.com.br', name: 'Quirino Saldanha', number: 5, position: 'SG', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'quintino.teles@quadra.com.br', name: 'Quintino Teles', number: 6, position: 'SF', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'raimundo.ulhoa@quadra.com.br', name: 'Raimundo Ulhoa', number: 7, position: 'PF', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'ramiro.valadares@quadra.com.br', name: 'Ramiro Valadares', number: 8, position: 'C', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'randolfo.wagner@quadra.com.br', name: 'Randolfo Wagner', number: 9, position: 'PG', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'reginaldo.xavier@quadra.com.br', name: 'Reginaldo Xavier', number: 10, position: 'SG', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'reinaldo.yoshida@quadra.com.br', name: 'Reinaldo Yoshida', number: 11, position: 'SF', currentTeamId: 'puc-time-15', status: 'ACTIVE' },
  { id: 'salvador.barreto@quadra.com.br', name: 'Salvador Barreto', number: 4, position: 'PG', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
  { id: 'sebastiao.camargo@quadra.com.br', name: 'Sebastião Camargo', number: 5, position: 'SG', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
  { id: 'sidnei.delfino@quadra.com.br', name: 'Sidnei Delfino', number: 6, position: 'SF', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
  { id: 'silas.espinoza@quadra.com.br', name: 'Silas Espinoza', number: 7, position: 'PF', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
  { id: 'simao.fagundes@quadra.com.br', name: 'Simão Fagundes', number: 8, position: 'C', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
  { id: 'socrates.goulart@quadra.com.br', name: 'Socrates Goulart', number: 9, position: 'PG', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
  { id: 'tarcisio.haddad@quadra.com.br', name: 'Tarcisio Haddad', number: 10, position: 'SG', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
  { id: 'teodoro.inacio@quadra.com.br', name: 'Teodoro Inacio', number: 11, position: 'SF', currentTeamId: 'puc-time-16', status: 'ACTIVE' },
]

const ATHLETES_BY_TEAM: Record<string, Athlete[]> = Object.fromEntries(MOCK_TEAMS.map((team) => [team.id, PUC_ATHLETES.filter((a) => a.currentTeamId === team.id)]))
let matchSeq=0
function mkMatch(tournamentId:string,date:string,homeTeamId:string,awayTeamId:string,home:number|null,away:number|null,status:Match['status'],venue:string,id?:string):Match{const isFinished=status==='FINISHED';return{id:id??`m${++matchSeq}`,tournamentId,date,homeTeamId,awayTeamId,homeScore:home,awayScore:away,status,venue,tournamentGroupId:null,bracketRound:null,homeLossType:isFinished&&home!==null&&away!==null&&home<away?'NORMAL':null,awayLossType:isFinished&&home!==null&&away!==null&&away<home?'NORMAL':null,scoreSource:isFinished?'PERIODS':null}}
function mkPlayer(a:Athlete,min:number,pts:number,reb:number,ast:number,stl:number,blk:number,to:number,pf:number,fgm:number,fga:number,tpm:number,tpa:number,ftm:number,fta:number):PlayerMatchStats{return{tournamentRosterId:`mock-roster-${a.currentTeamId}-${a.id}`,athleteId:a.id,athleteName:a.name,number:a.number,min,pts,reb,ast,stl,blk,to,pf,fgm,fga,tpm,tpa,ftm,fta}}
function mkPeriods(...pairs:Array<[number|null,number|null]>):PeriodScore[]{return pairs.map(([home,away],idx)=>{const n=idx+1;const ot=n>4;return{periodNumber:n,type:ot?'OVERTIME':'REGULAR',overtimeNumber:ot?n-4:null,homePoints:home,awayPoints:away}})}
function mkTeam(teamId:string,players:PlayerMatchStats[]):TeamMatchStats{return{teamId,players}}
function buildBoxScore(homeScore:number,awayScore:number,homeTeamId:string,awayTeamId:string){function distribute(score:number,roster:Athlete[],teamId:string){const players=roster.slice(0,8);const weights=players.map((_,i)=>(players.length-i)*3+2);const totalW=weights.reduce((s,x)=>s+x,0);let remaining=score;const stats:PlayerMatchStats[]=[];for(let i=0;i<players.length;i++){const isLast=i===players.length-1;let pts=isLast?remaining:Math.max(0,Math.round((score*weights[i])/totalW));if(!isLast)remaining-=pts;if(pts<0)pts=0;const fgm=Math.floor(pts*0.45);const tpm=Math.min(Math.floor(pts*0.15),Math.max(0,pts-fgm));const ftm=Math.max(0,pts-2*fgm-tpm);stats.push(mkPlayer(players[i],18+(i%5)*3,pts,2+(i%4),1+(i%3),i%2,i%3===0?1:0,1+(i%2),2+(i%3),fgm,fgm+3,tpm,tpm+2,ftm,ftm+1))}const sum=stats.reduce((s,p)=>s+p.pts,0);if(sum!==score&&stats.length)stats[stats.length-1].pts+=score-sum;return mkTeam(teamId,stats)}return{homeStats:distribute(homeScore,ATHLETES_BY_TEAM[homeTeamId]??[],homeTeamId),awayStats:distribute(awayScore,ATHLETES_BY_TEAM[awayTeamId]??[],awayTeamId)}}
const REGULATION='Fase classificatória em grupos. As melhores equipes avançam para playoffs em mata-mata. Desempate: vitórias, saldo de pontos, confronto direto.'
const GERAL='puc-geral-2026'; const INVERNO='puc-inverno-2026'

const geralLeaders: StatLeaders = { ppg: [{ athleteId: 'rafael.moura@quadra.com.br', athleteName: 'Rafael Moura', teamId: 'puc-time-1', value: 22.4, gamesPlayed: 6 }, { athleteId: 'nicolas.barbosa@quadra.com.br', athleteName: 'Nicolas Barbosa', teamId: 'puc-time-2', value: 21.1, gamesPlayed: 6 }, { athleteId: 'diego.santos@quadra.com.br', athleteName: 'Diego Santos', teamId: 'puc-time-1', value: 18.6, gamesPlayed: 6 }], rpg: [{ athleteId: 'felipe.oliveira@quadra.com.br', athleteName: 'Felipe Oliveira', teamId: 'puc-time-1', value: 10.2, gamesPlayed: 6 }, { athleteId: 'paulo.carvalho@quadra.com.br', athleteName: 'Paulo Carvalho', teamId: 'puc-time-2', value: 9.8, gamesPlayed: 6 }], apg: [{ athleteId: 'gabriel.costa@quadra.com.br', athleteName: 'Gabriel Costa', teamId: 'puc-time-1', value: 7.5, gamesPlayed: 6 }, { athleteId: 'pedro.gomes@quadra.com.br', athleteName: 'Pedro Gomes', teamId: 'puc-time-2', value: 6.9, gamesPlayed: 6 }], stg: [{ athleteId: 'rafael.moura@quadra.com.br', athleteName: 'Rafael Moura', teamId: 'puc-time-1', value: 2.1, gamesPlayed: 6 }, { athleteId: 'nicolas.barbosa@quadra.com.br', athleteName: 'Nicolas Barbosa', teamId: 'puc-time-2', value: 1.9, gamesPlayed: 6 }], bpg: [{ athleteId: 'henrique.lima@quadra.com.br', athleteName: 'Henrique Lima', teamId: 'puc-time-1', value: 1.4, gamesPlayed: 6 }, { athleteId: 'ricardo.araujo@quadra.com.br', athleteName: 'Ricardo Araujo', teamId: 'puc-time-2', value: 1.2, gamesPlayed: 6 }] }
const geralMatches: Match[] = [
  mkMatch(GERAL, '2026-03-07T19:00:00', 'puc-time-1', 'puc-time-2', 80, 89, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m01'),
  mkMatch(GERAL, '2026-03-14T19:00:00', 'puc-time-1', 'puc-time-3', 87, 83, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m02'),
  mkMatch(GERAL, '2026-03-21T19:00:00', 'puc-time-1', 'puc-time-4', 94, 77, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m03'),
  mkMatch(GERAL, '2026-03-28T19:00:00', 'puc-time-2', 'puc-time-3', 79, 83, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m04'),
  mkMatch(GERAL, '2026-04-04T19:00:00', 'puc-time-2', 'puc-time-4', 86, 77, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m05'),
  mkMatch(GERAL, '2026-04-11T19:00:00', 'puc-time-3', 'puc-time-4', 91, 88, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m06'),
  mkMatch(GERAL, '2026-03-07T19:00:00', 'puc-time-6', 'puc-time-5', 87, 91, 'FINISHED', 'Arena Central PUC', 'puc-geral-m07'),
  mkMatch(GERAL, '2026-03-14T19:00:00', 'puc-time-6', 'puc-time-7', 94, 81, 'FINISHED', 'Arena Central PUC', 'puc-geral-m08'),
  mkMatch(GERAL, '2026-03-21T19:00:00', 'puc-time-6', 'puc-time-8', 76, 75, 'FINISHED', 'Arena Central PUC', 'puc-geral-m09'),
  mkMatch(GERAL, '2026-03-28T19:00:00', 'puc-time-5', 'puc-time-7', 80, 81, 'FINISHED', 'Arena Central PUC', 'puc-geral-m10'),
  mkMatch(GERAL, '2026-04-04T19:00:00', 'puc-time-5', 'puc-time-8', 87, 75, 'FINISHED', 'Arena Central PUC', 'puc-geral-m11'),
  mkMatch(GERAL, '2026-04-11T19:00:00', 'puc-time-7', 'puc-time-8', 90, 86, 'FINISHED', 'Arena Central PUC', 'puc-geral-m12'),
  mkMatch(GERAL, '2026-03-07T19:00:00', 'puc-time-9', 'puc-time-10', 88, 90, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m13'),
  mkMatch(GERAL, '2026-03-14T19:00:00', 'puc-time-9', 'puc-time-11', 70, 79, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m14'),
  mkMatch(GERAL, '2026-03-21T19:00:00', 'puc-time-9', 'puc-time-12', 77, 73, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m15'),
  mkMatch(GERAL, '2026-03-28T19:00:00', 'puc-time-10', 'puc-time-11', 87, 88, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m16'),
  mkMatch(GERAL, '2026-04-04T19:00:00', 'puc-time-10', 'puc-time-12', 94, 73, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m17'),
  mkMatch(GERAL, '2026-04-11T19:00:00', 'puc-time-11', 'puc-time-12', 89, 84, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m18'),
  mkMatch(GERAL, '2026-03-07T19:00:00', 'puc-time-13', 'puc-time-14', 92, 96, 'FINISHED', 'Arena Central PUC', 'puc-geral-m19'),
  mkMatch(GERAL, '2026-03-14T19:00:00', 'puc-time-13', 'puc-time-15', 74, 77, 'FINISHED', 'Arena Central PUC', 'puc-geral-m20'),
  mkMatch(GERAL, '2026-03-21T19:00:00', 'puc-time-13', 'puc-time-16', 81, 71, 'FINISHED', 'Arena Central PUC', 'puc-geral-m21'),
  mkMatch(GERAL, '2026-03-28T19:00:00', 'puc-time-14', 'puc-time-15', 91, 94, 'FINISHED', 'Arena Central PUC', 'puc-geral-m22'),
  mkMatch(GERAL, '2026-04-04T19:00:00', 'puc-time-14', 'puc-time-16', 73, 71, 'FINISHED', 'Arena Central PUC', 'puc-geral-m23'),
  mkMatch(GERAL, '2026-04-11T19:00:00', 'puc-time-15', 'puc-time-16', 83, 82, 'FINISHED', 'Arena Central PUC', 'puc-geral-m24'),
  mkMatch(GERAL, '2026-05-10T19:00:00', 'puc-time-1', 'puc-time-5', 86, 82, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m25'),
  mkMatch(GERAL, '2026-05-10T21:00:00', 'puc-time-6', 'puc-time-2', 70, 78, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m26'),
  mkMatch(GERAL, '2026-05-11T19:00:00', 'puc-time-9', 'puc-time-14', 86, 83, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m27'),
  mkMatch(GERAL, '2026-05-11T21:00:00', 'puc-time-13', 'puc-time-10', 84, 81, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m28'),
  mkMatch(GERAL, '2026-05-24T19:00:00', 'puc-time-1', 'puc-time-13', 82, 78, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m29'),
  mkMatch(GERAL, '2026-05-24T21:00:00', 'puc-time-2', 'puc-time-9', 86, 69, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m30'),
  mkMatch(GERAL, '2026-05-31T20:00:00', 'puc-time-1', 'puc-time-2', 84, 80, 'FINISHED', 'Ginásio PUC Campinas', 'puc-geral-m31'),
]
export const seedBracketRounds = [{ name:'Quartas de final',matches:[{id:'geral-qf1',matchId:'puc-geral-m25',homeTeamId:'puc-time-1',awayTeamId:'puc-time-5',winnerId:'puc-time-1'},{id:'geral-qf4',matchId:'puc-geral-m28',homeTeamId:'puc-time-13',awayTeamId:'puc-time-10',winnerId:'puc-time-13'},{id:'geral-qf2',matchId:'puc-geral-m26',homeTeamId:'puc-time-6',awayTeamId:'puc-time-2',winnerId:'puc-time-2'},{id:'geral-qf3',matchId:'puc-geral-m27',homeTeamId:'puc-time-9',awayTeamId:'puc-time-14',winnerId:'puc-time-9'}]},{name:'Semifinais',matches:[{id:'geral-sf1',matchId:'puc-geral-m29',homeTeamId:'puc-time-1',awayTeamId:'puc-time-13',winnerId:'puc-time-1'},{id:'geral-sf2',matchId:'puc-geral-m30',homeTeamId:'puc-time-2',awayTeamId:'puc-time-9',winnerId:'puc-time-2'}]},{name:'Final',matches:[{id:'geral-f1',matchId:'puc-geral-m31',homeTeamId:'puc-time-1',awayTeamId:'puc-time-2',winnerId:'puc-time-1'}]}]
const geralTournament: Tournament={id:GERAL,name:'Campeonato Geral da PUC 2026',seasonId:'season-2025-26',categoryId:'cat-adulto-masc',format:'GROUP_STAGE_KNOCKOUT',status:'COMPLETED',teamIds:MOCK_TEAMS.map((t)=>t.id),matchCount:31,finishedMatchCount:31,startDate:'2026-03-01',endDate:'2026-05-31',updatedAt:'2026-05-31T22:00:00',regulation:REGULATION,leaders:geralLeaders,championTournamentTeamId:'tournament-team-puc-geral-2026-puc-time-1'}
const invernoMatches: Match[] = [
  mkMatch(INVERNO, '2026-07-03T19:00:00', 'puc-time-1', 'puc-time-2', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m01'),
  mkMatch(INVERNO, '2026-07-05T19:00:00', 'puc-time-1', 'puc-time-3', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m02'),
  mkMatch(INVERNO, '2026-07-07T19:00:00', 'puc-time-1', 'puc-time-4', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m03'),
  mkMatch(INVERNO, '2026-07-09T19:00:00', 'puc-time-2', 'puc-time-3', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m04'),
  mkMatch(INVERNO, '2026-07-11T19:00:00', 'puc-time-2', 'puc-time-4', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m05'),
  mkMatch(INVERNO, '2026-07-13T19:00:00', 'puc-time-3', 'puc-time-4', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m06'),
  mkMatch(INVERNO, '2026-07-15T19:00:00', 'puc-time-5', 'puc-time-6', null, null, 'SCHEDULED', 'Arena Central PUC', 'puc-inverno-m07'),
  mkMatch(INVERNO, '2026-07-17T19:00:00', 'puc-time-5', 'puc-time-7', null, null, 'SCHEDULED', 'Arena Central PUC', 'puc-inverno-m08'),
  mkMatch(INVERNO, '2026-07-19T19:00:00', 'puc-time-5', 'puc-time-8', null, null, 'SCHEDULED', 'Arena Central PUC', 'puc-inverno-m09'),
  mkMatch(INVERNO, '2026-07-21T19:00:00', 'puc-time-6', 'puc-time-7', null, null, 'SCHEDULED', 'Arena Central PUC', 'puc-inverno-m10'),
  mkMatch(INVERNO, '2026-07-23T19:00:00', 'puc-time-6', 'puc-time-8', null, null, 'SCHEDULED', 'Arena Central PUC', 'puc-inverno-m11'),
  mkMatch(INVERNO, '2026-07-25T19:00:00', 'puc-time-7', 'puc-time-8', null, null, 'SCHEDULED', 'Arena Central PUC', 'puc-inverno-m12'),
  mkMatch(INVERNO, '2026-07-25T19:00:00', 'puc-time-1', 'puc-time-4', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m13'),
  mkMatch(INVERNO, '2026-07-25T21:00:00', 'puc-time-5', 'puc-time-8', null, null, 'SCHEDULED', 'Arena Central PUC', 'puc-inverno-m14'),
  mkMatch(INVERNO, '2026-07-31T20:00:00', 'puc-time-1', 'puc-time-5', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'puc-inverno-m15'),
]
const invernoTournament: Tournament = { id: INVERNO, name: 'Copa de Inverno PUC', seasonId: 'season-2025-26', categoryId: 'cat-adulto-masc', format: 'GROUP_STAGE_KNOCKOUT', status: 'REGISTRATION', teamIds: ['puc-time-1','puc-time-2','puc-time-3','puc-time-4','puc-time-5','puc-time-6','puc-time-7','puc-time-8'], matchCount: 16, finishedMatchCount: 0, startDate: '2026-07-01', endDate: '2026-07-31', updatedAt: '2026-07-01T10:00:00', regulation: REGULATION, leaders: { ppg: [], rpg: [], apg: [], stg: [], bpg: [] }, championTournamentTeamId: null }
export const seedTournaments: Tournament[] = [geralTournament, invernoTournament]

/** Group membership of the demo tournaments, seeded into the store (UI spec §7.4). The
 *  classification itself is not seeded: it is derived from the matches, which already exist. */
export const seedGroupMembership = [
  { tournamentId: GERAL, groupName: 'Grupo A', teamIds: ['puc-time-1', 'puc-time-2', 'puc-time-3', 'puc-time-4'] },
  { tournamentId: GERAL, groupName: 'Grupo B', teamIds: ['puc-time-5', 'puc-time-6', 'puc-time-7', 'puc-time-8'] },
  { tournamentId: GERAL, groupName: 'Grupo C', teamIds: ['puc-time-9', 'puc-time-10', 'puc-time-11', 'puc-time-12'] },
  { tournamentId: GERAL, groupName: 'Grupo D', teamIds: ['puc-time-13', 'puc-time-14', 'puc-time-15', 'puc-time-16'] },
  { tournamentId: INVERNO, groupName: 'Grupo A', teamIds: ['puc-time-1', 'puc-time-2', 'puc-time-3', 'puc-time-4'] },
  { tournamentId: INVERNO, groupName: 'Grupo B', teamIds: ['puc-time-5', 'puc-time-6', 'puc-time-7', 'puc-time-8'] },
]

const seedGroupNameOf = (tournamentId: string, teamId: string): string | null =>
  seedGroupMembership.find((g) => g.tournamentId === tournamentId && g.teamIds.includes(teamId))?.groupName ?? null

/** Knockout match ids — bracket games must not get a group id even when both sides share a group
 *  (Inverno's semifinals do). Geral knockout ids come from seedBracketRounds. */
const seedKnockoutMatchIds = new Set([
  ...seedBracketRounds.flatMap((round) => round.matches.map((slot) => slot.matchId)),
  'puc-inverno-m13',
  'puc-inverno-m14',
  'puc-inverno-m15',
])

/** A match belongs to a group only when it is a group-stage game between two teams of the same
 *  group. Knockout ids exclude bracket games. The id shape is the one `sportsApi/index.ts`
 *  rebuilds for the store seed. */
const seedGroupIdOf = (match: Match): string | null => {
  if (seedKnockoutMatchIds.has(match.id)) return null
  const home = seedGroupNameOf(match.tournamentId, match.homeTeamId)
  const away = seedGroupNameOf(match.tournamentId, match.awayTeamId)
  return home && home === away ? `seed-group-${match.tournamentId}-${home}` : null
}
// Stable scheduled match used to demo/record a súmula (two teams with rostered athletes).
const sumulaSeedMatch = mkMatch(INVERNO, '2026-07-04T19:00:00', 'puc-time-1', 'puc-time-2', null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 'match-1')
const abandonedSeedMatch = mkMatch('read-model-fixtures', '2026-07-05T19:00:00', 'puc-time-3', 'puc-time-4', 2, 0, 'FINISHED', 'Ginásio PUC Campinas', 'match-abandoned')
abandonedSeedMatch.awayLossType = 'DEFAULT'
abandonedSeedMatch.scoreSource = 'AWARDED'
const forfeitSeedMatch = mkMatch('read-model-fixtures', '2026-07-06T19:00:00', 'puc-time-3', 'puc-time-4', 20, 0, 'FINISHED', 'Ginásio PUC Campinas', 'match-forfeit')
forfeitSeedMatch.awayLossType = 'FORFEIT'
forfeitSeedMatch.scoreSource = 'AWARDED'
export const seedMatches: Match[] = [...geralMatches, ...invernoMatches, sumulaSeedMatch, abandonedSeedMatch, forfeitSeedMatch]
  .map((match) => ({
    ...match,
    tournamentGroupId: seedGroupIdOf(match),
  }))
const MOCK_TOURNAMENTS = seedTournaments
const MOCK_MATCHES = seedMatches
const MATCH_EXTRA: Record<string, { periodScores: PeriodScore[] | null; homeStats: TeamMatchStats; awayStats: TeamMatchStats }> = {
  'match-abandoned': (() => { const b = buildBoxScore(68, 71, 'puc-time-3', 'puc-time-4'); return { periodScores: mkPeriods([17,18], [16,19], [18,17], [17,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'match-forfeit': { periodScores: [], homeStats: { teamId: 'puc-time-3', players: [] }, awayStats: { teamId: 'puc-time-4', players: [] } },
  'puc-geral-m01': (() => { const b = buildBoxScore(80, 89, 'puc-time-1', 'puc-time-2'); return { periodScores: mkPeriods([20,22], [23,23], [19,24], [18,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m02': (() => { const b = buildBoxScore(87, 83, 'puc-time-1', 'puc-time-3'); return { periodScores: mkPeriods([21,20], [25,22], [21,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m03': (() => { const b = buildBoxScore(94, 77, 'puc-time-1', 'puc-time-4'); return { periodScores: mkPeriods([23,19], [26,20], [23,21], [22,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m04': (() => { const b = buildBoxScore(79, 83, 'puc-time-2', 'puc-time-3'); return { periodScores: mkPeriods([19,20], [23,22], [19,22], [18,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m05': (() => { const b = buildBoxScore(86, 77, 'puc-time-2', 'puc-time-4'); return { periodScores: mkPeriods([21,19], [24,20], [21,21], [20,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m06': (() => { const b = buildBoxScore(91, 88, 'puc-time-3', 'puc-time-4'); return { periodScores: mkPeriods([22,22], [26,23], [22,23], [21,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m07': (() => { const b = buildBoxScore(87, 91, 'puc-time-6', 'puc-time-5'); return { periodScores: mkPeriods([21,22], [25,24], [21,24], [20,21]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m08': (() => { const b = buildBoxScore(94, 81, 'puc-time-6', 'puc-time-7'); return { periodScores: mkPeriods([23,20], [26,21], [23,22], [22,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m09': (() => { const b = buildBoxScore(76, 75, 'puc-time-6', 'puc-time-8'); return { periodScores: mkPeriods([19,18], [22,20], [18,20], [17,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m10': (() => { const b = buildBoxScore(80, 81, 'puc-time-5', 'puc-time-7'); return { periodScores: mkPeriods([20,20], [23,21], [19,22], [18,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m11': (() => { const b = buildBoxScore(87, 75, 'puc-time-5', 'puc-time-8'); return { periodScores: mkPeriods([21,18], [25,20], [21,20], [20,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m12': (() => { const b = buildBoxScore(90, 86, 'puc-time-7', 'puc-time-8'); return { periodScores: mkPeriods([22,21], [25,22], [22,23], [21,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m13': (() => { const b = buildBoxScore(88, 90, 'puc-time-9', 'puc-time-10'); return { periodScores: mkPeriods([22,22], [25,23], [21,24], [20,21]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m14': (() => { const b = buildBoxScore(70, 79, 'puc-time-9', 'puc-time-11'); return { periodScores: mkPeriods([17,19], [20,21], [17,21], [16,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m15': (() => { const b = buildBoxScore(77, 73, 'puc-time-9', 'puc-time-12'); return { periodScores: mkPeriods([19,18], [22,19], [19,20], [17,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m16': (() => { const b = buildBoxScore(87, 88, 'puc-time-10', 'puc-time-11'); return { periodScores: mkPeriods([21,22], [25,23], [21,23], [20,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m17': (() => { const b = buildBoxScore(94, 73, 'puc-time-10', 'puc-time-12'); return { periodScores: mkPeriods([23,18], [26,19], [23,20], [22,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m18': (() => { const b = buildBoxScore(89, 84, 'puc-time-11', 'puc-time-12'); return { periodScores: mkPeriods([22,21], [25,22], [22,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m19': (() => { const b = buildBoxScore(92, 96, 'puc-time-13', 'puc-time-14'); return { periodScores: mkPeriods([23,24], [26,25], [22,25], [21,22]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m20': (() => { const b = buildBoxScore(74, 77, 'puc-time-13', 'puc-time-15'); return { periodScores: mkPeriods([18,19], [21,20], [18,21], [17,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m21': (() => { const b = buildBoxScore(81, 71, 'puc-time-13', 'puc-time-16'); return { periodScores: mkPeriods([20,17], [23,19], [20,19], [18,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m22': (() => { const b = buildBoxScore(91, 94, 'puc-time-14', 'puc-time-15'); return { periodScores: mkPeriods([22,23], [26,24], [22,25], [21,22]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m23': (() => { const b = buildBoxScore(73, 71, 'puc-time-14', 'puc-time-16'); return { periodScores: mkPeriods([18,17], [21,19], [18,19], [16,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m24': (() => { const b = buildBoxScore(83, 82, 'puc-time-15', 'puc-time-16'); return { periodScores: mkPeriods([20,20], [24,21], [20,22], [19,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m25': (() => { const b = buildBoxScore(86, 82, 'puc-time-1', 'puc-time-5'); return { periodScores: mkPeriods([21,20], [24,21], [21,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m26': (() => { const b = buildBoxScore(70, 78, 'puc-time-6', 'puc-time-2'); return { periodScores: mkPeriods([17,19], [20,20], [17,21], [16,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m27': (() => { const b = buildBoxScore(86, 83, 'puc-time-9', 'puc-time-14'); return { periodScores: mkPeriods([21,20], [24,22], [21,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m28': (() => { const b = buildBoxScore(84, 81, 'puc-time-13', 'puc-time-10'); return { periodScores: mkPeriods([21,20], [24,21], [20,22], [19,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m29': (() => { const b = buildBoxScore(82, 78, 'puc-time-1', 'puc-time-13'); return { periodScores: mkPeriods([20,19], [23,20], [20,21], [19,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
  'puc-geral-m30': (() => { const b = buildBoxScore(86, 69, 'puc-time-2', 'puc-time-9'); return { periodScores: mkPeriods([21,17], [24,18], [21,19], [20,15]), homeStats: b.homeStats, awayStats: b.awayStats }; })(),
}
const FINAL_HOME = mkTeam('puc-time-1', [
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'rafael.moura@quadra.com.br')!, 38, 24, 5, 6, 2, 0, 2, 2, 9, 17, 2, 5, 4, 5),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'diego.santos@quadra.com.br')!, 36, 18, 4, 3, 1, 1, 1, 3, 7, 14, 1, 4, 3, 4),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'felipe.oliveira@quadra.com.br')!, 34, 14, 8, 2, 0, 2, 2, 3, 5, 10, 0, 1, 4, 5),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'gabriel.costa@quadra.com.br')!, 32, 12, 3, 5, 2, 0, 1, 2, 4, 9, 2, 5, 2, 2),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'henrique.lima@quadra.com.br')!, 28, 10, 6, 1, 1, 0, 1, 2, 4, 8, 0, 2, 2, 3),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'igor.martins@quadra.com.br')!, 22,  4, 4, 2, 0, 0, 1, 1, 2, 5, 0, 1, 0, 0),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'joao.pereira@quadra.com.br')!, 20,  2, 3, 1, 0, 0, 0, 1, 1, 3, 0, 1, 0, 0),
])
const FINAL_AWAY = mkTeam('puc-time-2', [
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'nicolas.barbosa@quadra.com.br')!, 38, 22, 4, 4, 2, 0, 3, 2, 8, 16, 2, 6, 4, 5),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'otavio.ribeiro@quadra.com.br')!, 36, 16, 5, 3, 1, 1, 2, 3, 6, 12, 1, 4, 3, 4),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'paulo.carvalho@quadra.com.br')!, 34, 14, 7, 2, 0, 1, 1, 2, 5, 10, 1, 3, 3, 4),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'pedro.gomes@quadra.com.br')!, 32, 12, 3, 5, 2, 0, 2, 2, 4, 9, 2, 5, 2, 2),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'ricardo.araujo@quadra.com.br')!, 28, 10, 5, 1, 0, 0, 1, 3, 4, 8, 0, 2, 2, 3),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'roberto.nunes@quadra.com.br')!, 24,  4, 4, 1, 0, 0, 1, 1, 2, 5, 0, 1, 0, 0),
  mkPlayer(PUC_ATHLETES.find((a) => a.id === 'rodrigo.melo@quadra.com.br')!, 18,  2, 2, 1, 0, 0, 0, 1, 1, 3, 0, 1, 0, 0),
])
MATCH_EXTRA['puc-geral-m31'] = { periodScores: mkPeriods([22,20],[18,22],[20,18],[16,16],[8,4]), homeStats: FINAL_HOME, awayStats: FINAL_AWAY }

export function getTeams(): Team[] { return MOCK_TEAMS }
export function getTournaments(): Tournament[] { return MOCK_TOURNAMENTS }
export function getTournamentById(id: string): Tournament | undefined { return MOCK_TOURNAMENTS.find((c) => c.id === id) }
export function getMatchesByTournament(tournamentId: string): Match[] { return MOCK_MATCHES.filter((m) => m.tournamentId === tournamentId) }
export function getSeasons(): Season[] { return seedSeasons }
export function getCategories(): TournamentCategory[] { return seedCategories }
export function getSeasonLabel(seasonId: string): string { return seedSeasons.find((s) => s.id === seasonId)?.label ?? seasonId }
export function getCategoryName(categoryId: string | null): string { return categoryId ? (seedCategories.find((c) => c.id === categoryId)?.name ?? categoryId) : '—' }
export function getAllMatches(): Match[] { return MOCK_MATCHES }
export function getMatchDetailById(id: string): MatchDetail | undefined { const match = MOCK_MATCHES.find((m) => m.id === id); if (!match) return undefined; const extra = MATCH_EXTRA[id]; return { ...match, periodScores: extra?.periodScores ?? null, homeStats: extra?.homeStats ?? { teamId: match.homeTeamId, players: [] }, awayStats: extra?.awayStats ?? { teamId: match.awayTeamId, players: [] }, mvp: null } }
export const MOCK_ATHLETES: Athlete[] = PUC_ATHLETES
export function getAthletes(): Athlete[] { return MOCK_ATHLETES }
export function getAthleteById(athleteId: string): Athlete | undefined { return MOCK_ATHLETES.find((a) => a.id === athleteId) }
function getAthleteAppearances(athleteId?: string) { return Object.entries(MATCH_EXTRA).flatMap(([matchId, extra]) => { const match = MOCK_MATCHES.find((item) => item.id === matchId); if (!match) return []; const home = extra.homeStats.players.filter((p) => !athleteId || p.athleteId === athleteId).map((p) => ({ player: p, teamId: extra.homeStats.teamId, match })); const away = extra.awayStats.players.filter((p) => !athleteId || p.athleteId === athleteId).map((p) => ({ player: p, teamId: extra.awayStats.teamId, match })); return [...home, ...away] }) }
export function getAthleteMatches(athleteId: string): AthleteMatchStatsRow[] { return getAthleteAppearances(athleteId).map(({ player, teamId, match }) => { const tournament = getTournamentById(match.tournamentId); const homeTeam = MOCK_TEAMS.find((t) => t.id === match.homeTeamId); const awayTeam = MOCK_TEAMS.find((t) => t.id === match.awayTeamId); const athleteIsHome = teamId === match.homeTeamId; const athleteScore = athleteIsHome ? match.homeScore : match.awayScore; const opponentScore = athleteIsHome ? match.awayScore : match.homeScore; const scoreText = athleteScore === null || opponentScore === null ? '—' : `${athleteScore > opponentScore ? 'V' : 'D'} ${athleteScore}-${opponentScore}`; if (!tournament) return null; return { match, tournament, teamId, matchup: `${homeTeam?.name ?? match.homeTeamId} × ${awayTeam?.name ?? match.awayTeamId}`, result: scoreText, stats: player } }).filter((row): row is AthleteMatchStatsRow => Boolean(row)).sort((a, b) => +new Date(b.match.date) - +new Date(a.match.date)) }
export function getAthleteSummaryById(athleteId: string): AthleteStatTotals { return aggregateAthleteStats(getAthleteMatches(athleteId).map((row) => row.stats)) }
export function getAthleteTournamentStats(athleteId: string): AthleteTournamentStatsRow[] { const grouped = new Map<string, AthleteMatchStatsRow[]>(); getAthleteMatches(athleteId).forEach((row) => { const key = `${row.tournament.id}:${row.teamId}`; grouped.set(key, [...(grouped.get(key) ?? []), row]) }); return [...grouped.values()].map((rows) => ({ tournament: rows[0].tournament, teamId: rows[0].teamId, totals: aggregateAthleteStats(rows.map((row) => row.stats)) })).sort((a, b) => +new Date(b.tournament.startDate) - +new Date(a.tournament.startDate)) }
