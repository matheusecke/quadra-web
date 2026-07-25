/**
 * Sports domain — MOCK DATA (PUC Campinas Basquete demo).
 * Numeric IDs follow docs/superpowers/plans/2026-07-22-sports-numeric-ids.md
 * (Team N = puc-time-N; Athlete 101+index; Tournament 1=Geral, 2=Inverno, 3=fixtures).
 * Team/athlete display names still trace tcc-api/prisma/seeds/puc-dev-seed.sql.
 */
import type { Athlete, AthleteMatchStatsRow, AthleteStatTotals, AthleteTournamentStatsRow, Match, MatchDetail, MatchMvp, PeriodScore, PlayerMatchStats, Season, StatLeaders, Team, TeamMatchStats, Tournament, TournamentCategory } from './types'
import { SHOOTING_FIELDS, type StatField } from './statistics'
import { aggregateAthleteStats } from './sportsUtils'
import { SEED_TOURNAMENT, seedRosterId, tournamentTeamId } from './seedIds'

export const seedSeasons: Season[] = [
  { id: 1, label: '2025/26', startDate: '2025-08-01', endDate: '2026-07-31', status: 'ACTIVE' },
]

export const seedCategories: TournamentCategory[] = [
  { id: 1, name: 'Sub-19', sortOrder: 1, status: 'ACTIVE' },
  { id: 2, name: 'Adulto Masculino', sortOrder: 2, status: 'ACTIVE' },
]
export const MOCK_TEAMS: Team[] = [
  { id: 1, name: 'Time 1', shortName: 'T01', city: 'Campinas' },
  { id: 2, name: 'Time 2', shortName: 'T02', city: 'Campinas' },
  { id: 3, name: 'Time 3', shortName: 'T03', city: 'Campinas' },
  { id: 4, name: 'Time 4', shortName: 'T04', city: 'Campinas' },
  { id: 5, name: 'Time 5', shortName: 'T05', city: 'Campinas' },
  { id: 6, name: 'Time 6', shortName: 'T06', city: 'Campinas' },
  { id: 7, name: 'Time 7', shortName: 'T07', city: 'Campinas' },
  { id: 8, name: 'Time 8', shortName: 'T08', city: 'Campinas' },
  { id: 9, name: 'Time 9', shortName: 'T09', city: 'Campinas' },
  { id: 10, name: 'Time 10', shortName: 'T10', city: 'Campinas' },
  { id: 11, name: 'Time 11', shortName: 'T11', city: 'Campinas' },
  { id: 12, name: 'Time 12', shortName: 'T12', city: 'Campinas' },
  { id: 13, name: 'Time 13', shortName: 'T13', city: 'Campinas' },
  { id: 14, name: 'Time 14', shortName: 'T14', city: 'Campinas' },
  { id: 15, name: 'Time 15', shortName: 'T15', city: 'Campinas' },
  { id: 16, name: 'Time 16', shortName: 'T16', city: 'Campinas' },
]
const PUC_ATHLETES: Athlete[] = [
  { id: 101, name: 'Rafael Moura', number: 4, position: 'PG', currentTeamId: 1, status: 'ACTIVE' },
  { id: 102, name: 'Diego Santos', number: 5, position: null, currentTeamId: 1, status: 'ACTIVE' },
  { id: 103, name: 'Felipe Oliveira', number: 6, position: 'SF', currentTeamId: 1, status: 'ACTIVE' },
  { id: 104, name: 'Gabriel Costa', number: 7, position: 'PF', currentTeamId: 1, status: 'ACTIVE' },
  { id: 105, name: 'Henrique Lima', number: 8, position: 'C', currentTeamId: 1, status: 'ACTIVE' },
  { id: 106, name: 'Igor Martins', number: 9, position: 'PG', currentTeamId: 1, status: 'ACTIVE' },
  { id: 107, name: 'João Pereira', number: 10, position: 'SG', currentTeamId: 1, status: 'ACTIVE' },
  { id: 108, name: 'Lucas Rodrigues', number: 11, position: 'SF', currentTeamId: 1, status: 'ACTIVE' },
  { id: 109, name: 'Nicolas Barbosa', number: 4, position: 'PG', currentTeamId: 2, status: 'ACTIVE' },
  { id: 110, name: 'Otávio Ribeiro', number: 5, position: 'SG', currentTeamId: 2, status: 'ACTIVE' },
  { id: 111, name: 'Paulo Carvalho', number: 6, position: 'SF', currentTeamId: 2, status: 'ACTIVE' },
  { id: 112, name: 'Pedro Gomes', number: 7, position: 'PF', currentTeamId: 2, status: 'ACTIVE' },
  { id: 113, name: 'Ricardo Araujo', number: 8, position: 'C', currentTeamId: 2, status: 'ACTIVE' },
  { id: 114, name: 'Roberto Nunes', number: 9, position: 'PG', currentTeamId: 2, status: 'ACTIVE' },
  { id: 115, name: 'Rodrigo Melo', number: 10, position: 'SG', currentTeamId: 2, status: 'ACTIVE' },
  { id: 116, name: 'Samuel Castro', number: 11, position: 'SF', currentTeamId: 2, status: 'ACTIVE' },
  { id: 117, name: 'Vitor Campos', number: 4, position: 'PG', currentTeamId: 3, status: 'ACTIVE' },
  { id: 118, name: 'Wesley Cardoso', number: 5, position: 'SG', currentTeamId: 3, status: 'ACTIVE' },
  { id: 119, name: 'André Teixeira', number: 6, position: 'SF', currentTeamId: 3, status: 'ACTIVE' },
  { id: 120, name: 'Antonio Monteiro', number: 7, position: 'PF', currentTeamId: 3, status: 'ACTIVE' },
  { id: 121, name: 'Bernardo Pinto', number: 8, position: 'C', currentTeamId: 3, status: 'ACTIVE' },
  { id: 122, name: 'Caio Moreira', number: 9, position: 'PG', currentTeamId: 3, status: 'ACTIVE' },
  { id: 123, name: 'César Correia', number: 10, position: 'SG', currentTeamId: 3, status: 'ACTIVE' },
  { id: 124, name: 'Daniel Azevedo', number: 11, position: 'SF', currentTeamId: 3, status: 'ACTIVE' },
  { id: 125, name: 'Fábio Ramos', number: 4, position: 'PG', currentTeamId: 4, status: 'ACTIVE' },
  { id: 126, name: 'Fernando Lopes', number: 5, position: 'SG', currentTeamId: 4, status: 'ACTIVE' },
  { id: 127, name: 'Francisco Mendes', number: 6, position: 'SF', currentTeamId: 4, status: 'ACTIVE' },
  { id: 128, name: 'Giovani Fernandes', number: 7, position: 'PF', currentTeamId: 4, status: 'ACTIVE' },
  { id: 129, name: 'Guilherme Batista', number: 8, position: 'C', currentTeamId: 4, status: 'ACTIVE' },
  { id: 130, name: 'Gustavo Cavalcanti', number: 9, position: 'PG', currentTeamId: 4, status: 'ACTIVE' },
  { id: 131, name: 'Heitor Miranda', number: 10, position: 'SG', currentTeamId: 4, status: 'ACTIVE' },
  { id: 132, name: 'Hugo Xavier', number: 11, position: 'SF', currentTeamId: 4, status: 'ACTIVE' },
  { id: 133, name: 'Leandro Rezende', number: 4, position: 'PG', currentTeamId: 5, status: 'ACTIVE' },
  { id: 134, name: 'Leonardo Barros', number: 5, position: 'SG', currentTeamId: 5, status: 'ACTIVE' },
  { id: 135, name: 'Luan Farias', number: 6, position: 'SF', currentTeamId: 5, status: 'ACTIVE' },
  { id: 136, name: 'Luiz Andrade', number: 7, position: 'PF', currentTeamId: 5, status: 'ACTIVE' },
  { id: 137, name: 'Marcelo Borges', number: 8, position: 'C', currentTeamId: 5, status: 'ACTIVE' },
  { id: 138, name: 'Mauricio Tavares', number: 9, position: 'PG', currentTeamId: 5, status: 'ACTIVE' },
  { id: 139, name: 'Murilo Pacheco', number: 10, position: 'SG', currentTeamId: 5, status: 'ACTIVE' },
  { id: 140, name: 'Nelson Cruz', number: 11, position: 'SF', currentTeamId: 5, status: 'ACTIVE' },
  { id: 141, name: 'Rafael Coelho', number: 4, position: 'PG', currentTeamId: 6, status: 'ACTIVE' },
  { id: 142, name: 'Renato Macedo', number: 5, position: 'SG', currentTeamId: 6, status: 'ACTIVE' },
  { id: 143, name: 'Renan Paiva', number: 6, position: 'SF', currentTeamId: 6, status: 'ACTIVE' },
  { id: 144, name: 'Renato Campos', number: 7, position: 'PF', currentTeamId: 6, status: 'ACTIVE' },
  { id: 145, name: 'Ricardo Fonseca', number: 8, position: 'C', currentTeamId: 6, status: 'ACTIVE' },
  { id: 146, name: 'Robson Freire', number: 9, position: 'PG', currentTeamId: 6, status: 'ACTIVE' },
  { id: 147, name: 'Rogerio Santana', number: 10, position: 'SG', currentTeamId: 6, status: 'ACTIVE' },
  { id: 148, name: 'Ronaldo Matos', number: 11, position: 'SF', currentTeamId: 6, status: 'ACTIVE' },
  { id: 149, name: 'Sergio Moura', number: 4, position: 'PG', currentTeamId: 7, status: 'ACTIVE' },
  { id: 150, name: 'Silvio Brandao', number: 5, position: 'SG', currentTeamId: 7, status: 'ACTIVE' },
  { id: 151, name: 'Tadeu Prado', number: 6, position: 'SF', currentTeamId: 7, status: 'ACTIVE' },
  { id: 152, name: 'Tales Guimaraes', number: 7, position: 'PF', currentTeamId: 7, status: 'ACTIVE' },
  { id: 153, name: 'Túlio Ramires', number: 8, position: 'C', currentTeamId: 7, status: 'ACTIVE' },
  { id: 154, name: 'Valter Sales', number: 9, position: 'PG', currentTeamId: 7, status: 'ACTIVE' },
  { id: 155, name: 'Victor Alves', number: 10, position: 'SG', currentTeamId: 7, status: 'ACTIVE' },
  { id: 156, name: 'Vinicius Torres', number: 11, position: 'SF', currentTeamId: 7, status: 'ACTIVE' },
  { id: 157, name: 'William Dantas', number: 4, position: 'PG', currentTeamId: 8, status: 'ACTIVE' },
  { id: 158, name: 'Yuri Leal', number: 5, position: 'SG', currentTeamId: 8, status: 'ACTIVE' },
  { id: 159, name: 'Alex Santos', number: 6, position: 'SF', currentTeamId: 8, status: 'ACTIVE' },
  { id: 160, name: 'Alexandre Lemos', number: 7, position: 'PF', currentTeamId: 8, status: 'ACTIVE' },
  { id: 161, name: 'Alisson Neto', number: 8, position: 'C', currentTeamId: 8, status: 'ACTIVE' },
  { id: 162, name: 'Arthur Mota', number: 9, position: 'PG', currentTeamId: 8, status: 'ACTIVE' },
  { id: 163, name: 'Augusto César', number: 10, position: 'SG', currentTeamId: 8, status: 'ACTIVE' },
  { id: 164, name: 'Benicio Rocha', number: 11, position: 'SF', currentTeamId: 8, status: 'ACTIVE' },
  { id: 165, name: 'Claudio Barbosa', number: 4, position: 'PG', currentTeamId: 9, status: 'ACTIVE' },
  { id: 166, name: 'Cleber Amaral', number: 5, position: 'SG', currentTeamId: 9, status: 'ACTIVE' },
  { id: 167, name: 'Cristiano Bittencourt', number: 6, position: 'SF', currentTeamId: 9, status: 'ACTIVE' },
  { id: 168, name: 'Davi Cordeiro', number: 7, position: 'PF', currentTeamId: 9, status: 'ACTIVE' },
  { id: 169, name: 'Denis Figueiredo', number: 8, position: 'C', currentTeamId: 9, status: 'ACTIVE' },
  { id: 170, name: 'Douglas Henrique', number: 9, position: 'PG', currentTeamId: 9, status: 'ACTIVE' },
  { id: 171, name: 'Edson Junqueira', number: 10, position: 'SG', currentTeamId: 9, status: 'ACTIVE' },
  { id: 172, name: 'Elias Marques', number: 11, position: 'SF', currentTeamId: 9, status: 'ACTIVE' },
  { id: 173, name: 'Everton Trindade', number: 4, position: 'PG', currentTeamId: 10, status: 'ACTIVE' },
  { id: 174, name: 'Fabiano Uchoa', number: 5, position: 'SG', currentTeamId: 10, status: 'ACTIVE' },
  { id: 175, name: 'Felipe Valente', number: 6, position: 'SF', currentTeamId: 10, status: 'ACTIVE' },
  { id: 176, name: 'Filipe Ximenes', number: 7, position: 'PF', currentTeamId: 10, status: 'ACTIVE' },
  { id: 177, name: 'Flavio Zanetti', number: 8, position: 'C', currentTeamId: 10, status: 'ACTIVE' },
  { id: 178, name: 'Frederico Abreu', number: 9, position: 'PG', currentTeamId: 10, status: 'ACTIVE' },
  { id: 179, name: 'Geovane Aguiar', number: 10, position: 'SG', currentTeamId: 10, status: 'ACTIVE' },
  { id: 180, name: 'Gilberto Assis', number: 11, position: 'SF', currentTeamId: 10, status: 'ACTIVE' },
  { id: 181, name: 'Helio Domingues', number: 4, position: 'PG', currentTeamId: 11, status: 'ACTIVE' },
  { id: 182, name: 'Humberto Esteves', number: 5, position: 'SG', currentTeamId: 11, status: 'ACTIVE' },
  { id: 183, name: 'Isaac Franco', number: 6, position: 'SF', currentTeamId: 11, status: 'ACTIVE' },
  { id: 184, name: 'Italo Garcia', number: 7, position: 'PF', currentTeamId: 11, status: 'ACTIVE' },
  { id: 185, name: 'Jaime Henrique', number: 8, position: 'C', currentTeamId: 11, status: 'ACTIVE' },
  { id: 186, name: 'Jefferson Ibrahim', number: 9, position: 'PG', currentTeamId: 11, status: 'ACTIVE' },
  { id: 187, name: 'Jeferson Jacinto', number: 10, position: 'SG', currentTeamId: 11, status: 'ACTIVE' },
  { id: 188, name: 'Jonas Klein', number: 11, position: 'SF', currentTeamId: 11, status: 'ACTIVE' },
  { id: 189, name: 'Juliano Nobrega', number: 4, position: 'PG', currentTeamId: 12, status: 'ACTIVE' },
  { id: 190, name: 'Junior Ortega', number: 5, position: 'SG', currentTeamId: 12, status: 'ACTIVE' },
  { id: 191, name: 'Kauan Padilha', number: 6, position: 'SF', currentTeamId: 12, status: 'ACTIVE' },
  { id: 192, name: 'Kelvin Quintana', number: 7, position: 'PF', currentTeamId: 12, status: 'ACTIVE' },
  { id: 193, name: 'Kevin Rangel', number: 8, position: 'C', currentTeamId: 12, status: 'ACTIVE' },
  { id: 194, name: 'Kleber Siqueira', number: 9, position: 'PG', currentTeamId: 12, status: 'ACTIVE' },
  { id: 195, name: 'Laercio Toledo', number: 10, position: 'SG', currentTeamId: 12, status: 'ACTIVE' },
  { id: 196, name: 'Lauro Umbelino', number: 11, position: 'SF', currentTeamId: 12, status: 'ACTIVE' },
  { id: 197, name: 'Lincoln Xavier', number: 4, position: 'PG', currentTeamId: 13, status: 'ACTIVE' },
  { id: 198, name: 'Lorenzo Yamada', number: 5, position: 'SG', currentTeamId: 13, status: 'ACTIVE' },
  { id: 199, name: 'Luciano Zambelli', number: 6, position: 'SF', currentTeamId: 13, status: 'ACTIVE' },
  { id: 200, name: 'Luiz Abrahao', number: 7, position: 'PF', currentTeamId: 13, status: 'ACTIVE' },
  { id: 201, name: 'Manoel Bastos', number: 8, position: 'C', currentTeamId: 13, status: 'ACTIVE' },
  { id: 202, name: 'Marcio Coutinho', number: 9, position: 'PG', currentTeamId: 13, status: 'ACTIVE' },
  { id: 203, name: 'Mario Dourado', number: 10, position: 'SG', currentTeamId: 13, status: 'ACTIVE' },
  { id: 204, name: 'Matheus Espindola', number: 11, position: 'SF', currentTeamId: 13, status: 'ACTIVE' },
  { id: 205, name: 'Milton Holanda', number: 4, position: 'PG', currentTeamId: 14, status: 'ACTIVE' },
  { id: 206, name: 'Moises Ito', number: 5, position: 'SG', currentTeamId: 14, status: 'ACTIVE' },
  { id: 207, name: 'Natan Jardim', number: 6, position: 'SF', currentTeamId: 14, status: 'ACTIVE' },
  { id: 208, name: 'Nilton Kruger', number: 7, position: 'PF', currentTeamId: 14, status: 'ACTIVE' },
  { id: 209, name: 'Norberto Lobato', number: 8, position: 'C', currentTeamId: 14, status: 'ACTIVE' },
  { id: 210, name: 'Odair Macedo', number: 9, position: 'PG', currentTeamId: 14, status: 'ACTIVE' },
  { id: 211, name: 'Osmar Nogueira', number: 10, position: 'SG', currentTeamId: 14, status: 'ACTIVE' },
  { id: 212, name: 'Osvaldo Oliveira', number: 11, position: 'SF', currentTeamId: 14, status: 'ACTIVE' },
  { id: 213, name: 'Plinio Ribeiro', number: 4, position: 'PG', currentTeamId: 15, status: 'ACTIVE' },
  { id: 214, name: 'Quirino Saldanha', number: 5, position: 'SG', currentTeamId: 15, status: 'ACTIVE' },
  { id: 215, name: 'Quintino Teles', number: 6, position: 'SF', currentTeamId: 15, status: 'ACTIVE' },
  { id: 216, name: 'Raimundo Ulhoa', number: 7, position: 'PF', currentTeamId: 15, status: 'ACTIVE' },
  { id: 217, name: 'Ramiro Valadares', number: 8, position: 'C', currentTeamId: 15, status: 'ACTIVE' },
  { id: 218, name: 'Randolfo Wagner', number: 9, position: 'PG', currentTeamId: 15, status: 'ACTIVE' },
  { id: 219, name: 'Reginaldo Xavier', number: 10, position: 'SG', currentTeamId: 15, status: 'ACTIVE' },
  { id: 220, name: 'Reinaldo Yoshida', number: 11, position: 'SF', currentTeamId: 15, status: 'ACTIVE' },
  { id: 221, name: 'Salvador Barreto', number: 4, position: 'PG', currentTeamId: 16, status: 'ACTIVE' },
  { id: 222, name: 'Sebastião Camargo', number: 5, position: 'SG', currentTeamId: 16, status: 'ACTIVE' },
  { id: 223, name: 'Sidnei Delfino', number: 6, position: 'SF', currentTeamId: 16, status: 'ACTIVE' },
  { id: 224, name: 'Silas Espinoza', number: 7, position: 'PF', currentTeamId: 16, status: 'ACTIVE' },
  { id: 225, name: 'Simão Fagundes', number: 8, position: 'C', currentTeamId: 16, status: 'ACTIVE' },
  { id: 226, name: 'Socrates Goulart', number: 9, position: 'PG', currentTeamId: 16, status: 'ACTIVE' },
  { id: 227, name: 'Tarcisio Haddad', number: 10, position: 'SG', currentTeamId: 16, status: 'ACTIVE' },
  { id: 228, name: 'Teodoro Inacio', number: 11, position: 'SF', currentTeamId: 16, status: 'ACTIVE' },
]

const ATHLETES_BY_TEAM = new Map<number, Athlete[]>(MOCK_TEAMS.map((team) => [team.id, PUC_ATHLETES.filter((a) => a.currentTeamId === team.id)]))
let matchSeq=9000
function mkMatch(tournamentId:number,date:string,homeTeamId:number,awayTeamId:number,home:number|null,away:number|null,status:Match['status'],venue:string,id?:number):Match{const isFinished=status==='FINISHED';return{id:id??++matchSeq,tournamentId,date,homeTournamentTeamId:tournamentTeamId(tournamentId,homeTeamId),awayTournamentTeamId:tournamentTeamId(tournamentId,awayTeamId),homeScore:home,awayScore:away,status,venue,tournamentGroupId:null,bracketRound:null,homeLossType:isFinished&&home!==null&&away!==null&&home<away?'NORMAL':null,awayLossType:isFinished&&home!==null&&away!==null&&away<home?'NORMAL':null,scoreSource:isFinished?'PERIODS':null}}
function mkPlayer(tournamentId:number,a:Athlete,minutes:number,pts:number,reb:number,ast:number,stl:number,blk:number,tov:number,pf:number,fgm:number,fga:number,threeFgm:number,threeFga:number,ftm:number,fta:number):PlayerMatchStats{return{tournamentRosterId:seedRosterId(tournamentId,a.id),athleteId:a.id,athleteName:a.name,number:a.number,minutesSeconds:minutes*60,pts,reb,ast,stl,blk,tov,pf,fgm,fga,threeFgm,threeFga,ftm,fta}}
function mkPeriods(...pairs:Array<[number|null,number|null]>):PeriodScore[]{return pairs.map(([home,away],idx)=>{const n=idx+1;const ot=n>4;return{periodNumber:n,type:ot?'OVERTIME':'REGULAR',overtimeNumber:ot?n-4:null,homePoints:home,awayPoints:away}})}
function mkTeam(tournamentTeamId:number,players:PlayerMatchStats[]):TeamMatchStats{return{tournamentTeamId,players}}
function disableColumns(team:TeamMatchStats,fields:StatField[]):TeamMatchStats{return{...team,players:team.players.map((player)=>{const disabled=Object.fromEntries(fields.map((field)=>[field,null])) as Pick<PlayerMatchStats,StatField>;return{...player,...disabled}})}}
function buildBoxScore(tournamentId:number,homeScore:number,awayScore:number,homeTeamId:number,awayTeamId:number){function distribute(score:number,roster:Athlete[],teamIdForBoxScore:number){const players=roster.slice(0,8);const weights=players.map((_,i)=>(players.length-i)*3+2);const totalW=weights.reduce((s,x)=>s+x,0);let remaining=score;const stats:PlayerMatchStats[]=[];for(let i=0;i<players.length;i++){const isLast=i===players.length-1;let pts=isLast?remaining:Math.max(0,Math.round((score*weights[i])/totalW));if(!isLast)remaining-=pts;if(pts<0)pts=0;const fgm=Math.floor(pts*0.45);const threeFgm=Math.min(Math.floor(pts*0.15),Math.max(0,pts-fgm));const ftm=Math.max(0,pts-2*fgm-threeFgm);stats.push(mkPlayer(tournamentId,players[i],18+(i%5)*3,pts,2+(i%4),1+(i%3),i%2,i%3===0?1:0,1+(i%2),2+(i%3),fgm,fgm+3,threeFgm,threeFgm+2,ftm,ftm+1))}return mkTeam(teamIdForBoxScore,stats)}return{homeStats:distribute(homeScore,ATHLETES_BY_TEAM.get(homeTeamId)??[],tournamentTeamId(tournamentId,homeTeamId)),awayStats:distribute(awayScore,ATHLETES_BY_TEAM.get(awayTeamId)??[],tournamentTeamId(tournamentId,awayTeamId))}}
const REGULATION='Fase classificatória em grupos. As melhores equipes avançam para playoffs em mata-mata. Desempate: vitórias, saldo de pontos, confronto direto.'
const GERAL = SEED_TOURNAMENT.GERAL; const INVERNO = SEED_TOURNAMENT.INVERNO

const geralLeaders: StatLeaders = { ppg: [{ athleteId: 101, athleteName: 'Rafael Moura', tournamentTeamId: tournamentTeamId(GERAL, 1), teamId: 1, value: 22.4, gamesPlayed: 6 }, { athleteId: 109, athleteName: 'Nicolas Barbosa', tournamentTeamId: tournamentTeamId(GERAL, 2), teamId: 2, value: 21.1, gamesPlayed: 6 }, { athleteId: 102, athleteName: 'Diego Santos', tournamentTeamId: tournamentTeamId(GERAL, 1), teamId: 1, value: 18.6, gamesPlayed: 6 }], rpg: [{ athleteId: 103, athleteName: 'Felipe Oliveira', tournamentTeamId: tournamentTeamId(GERAL, 1), teamId: 1, value: 10.2, gamesPlayed: 6 }, { athleteId: 111, athleteName: 'Paulo Carvalho', tournamentTeamId: tournamentTeamId(GERAL, 2), teamId: 2, value: 9.8, gamesPlayed: 6 }], apg: [{ athleteId: 104, athleteName: 'Gabriel Costa', tournamentTeamId: tournamentTeamId(GERAL, 1), teamId: 1, value: 7.5, gamesPlayed: 6 }, { athleteId: 112, athleteName: 'Pedro Gomes', tournamentTeamId: tournamentTeamId(GERAL, 2), teamId: 2, value: 6.9, gamesPlayed: 6 }], stg: [{ athleteId: 101, athleteName: 'Rafael Moura', tournamentTeamId: tournamentTeamId(GERAL, 1), teamId: 1, value: 2.1, gamesPlayed: 6 }, { athleteId: 109, athleteName: 'Nicolas Barbosa', tournamentTeamId: tournamentTeamId(GERAL, 2), teamId: 2, value: 1.9, gamesPlayed: 6 }], bpg: [{ athleteId: 105, athleteName: 'Henrique Lima', tournamentTeamId: tournamentTeamId(GERAL, 1), teamId: 1, value: 1.4, gamesPlayed: 6 }, { athleteId: 113, athleteName: 'Ricardo Araujo', tournamentTeamId: tournamentTeamId(GERAL, 2), teamId: 2, value: 1.2, gamesPlayed: 6 }] }
const geralMatches: Match[] = [
  mkMatch(GERAL, '2026-03-07T19:00:00', 1, 2, 80, 89, 'FINISHED', 'Ginásio PUC Campinas', 101),
  mkMatch(GERAL, '2026-03-14T19:00:00', 1, 3, 87, 83, 'FINISHED', 'Ginásio PUC Campinas', 102),
  mkMatch(GERAL, '2026-03-21T19:00:00', 1, 4, 94, 77, 'FINISHED', 'Ginásio PUC Campinas', 103),
  mkMatch(GERAL, '2026-03-28T19:00:00', 2, 3, 79, 83, 'FINISHED', 'Ginásio PUC Campinas', 104),
  mkMatch(GERAL, '2026-04-04T19:00:00', 2, 4, 86, 77, 'FINISHED', 'Ginásio PUC Campinas', 105),
  mkMatch(GERAL, '2026-04-11T19:00:00', 3, 4, 91, 88, 'FINISHED', 'Ginásio PUC Campinas', 106),
  mkMatch(GERAL, '2026-03-07T19:00:00', 6, 5, 87, 91, 'FINISHED', 'Arena Central PUC', 107),
  mkMatch(GERAL, '2026-03-14T19:00:00', 6, 7, 94, 81, 'FINISHED', 'Arena Central PUC', 108),
  mkMatch(GERAL, '2026-03-21T19:00:00', 6, 8, 76, 75, 'FINISHED', 'Arena Central PUC', 109),
  mkMatch(GERAL, '2026-03-28T19:00:00', 5, 7, 80, 81, 'FINISHED', 'Arena Central PUC', 110),
  mkMatch(GERAL, '2026-04-04T19:00:00', 5, 8, 87, 75, 'FINISHED', 'Arena Central PUC', 111),
  mkMatch(GERAL, '2026-04-11T19:00:00', 7, 8, 90, 86, 'FINISHED', 'Arena Central PUC', 112),
  mkMatch(GERAL, '2026-03-07T19:00:00', 9, 10, 88, 90, 'FINISHED', 'Ginásio PUC Campinas', 113),
  mkMatch(GERAL, '2026-03-14T19:00:00', 9, 11, 70, 79, 'FINISHED', 'Ginásio PUC Campinas', 114),
  mkMatch(GERAL, '2026-03-21T19:00:00', 9, 12, 77, 73, 'FINISHED', 'Ginásio PUC Campinas', 115),
  mkMatch(GERAL, '2026-03-28T19:00:00', 10, 11, 87, 88, 'FINISHED', 'Ginásio PUC Campinas', 116),
  mkMatch(GERAL, '2026-04-04T19:00:00', 10, 12, 94, 73, 'FINISHED', 'Ginásio PUC Campinas', 117),
  mkMatch(GERAL, '2026-04-11T19:00:00', 11, 12, 89, 84, 'FINISHED', 'Ginásio PUC Campinas', 118),
  mkMatch(GERAL, '2026-03-07T19:00:00', 13, 14, 92, 96, 'FINISHED', 'Arena Central PUC', 119),
  mkMatch(GERAL, '2026-03-14T19:00:00', 13, 15, 74, 77, 'FINISHED', 'Arena Central PUC', 120),
  mkMatch(GERAL, '2026-03-21T19:00:00', 13, 16, 81, 71, 'FINISHED', 'Arena Central PUC', 121),
  mkMatch(GERAL, '2026-03-28T19:00:00', 14, 15, 91, 94, 'FINISHED', 'Arena Central PUC', 122),
  mkMatch(GERAL, '2026-04-04T19:00:00', 14, 16, 73, 71, 'FINISHED', 'Arena Central PUC', 123),
  mkMatch(GERAL, '2026-04-11T19:00:00', 15, 16, 83, 82, 'FINISHED', 'Arena Central PUC', 124),
  mkMatch(GERAL, '2026-05-10T19:00:00', 1, 5, 86, 82, 'FINISHED', 'Ginásio PUC Campinas', 125),
  mkMatch(GERAL, '2026-05-10T21:00:00', 6, 2, 70, 78, 'FINISHED', 'Ginásio PUC Campinas', 126),
  mkMatch(GERAL, '2026-05-11T19:00:00', 9, 14, 86, 83, 'FINISHED', 'Ginásio PUC Campinas', 127),
  mkMatch(GERAL, '2026-05-11T21:00:00', 13, 10, 84, 81, 'FINISHED', 'Ginásio PUC Campinas', 128),
  mkMatch(GERAL, '2026-05-24T19:00:00', 1, 13, 82, 78, 'FINISHED', 'Ginásio PUC Campinas', 129),
  mkMatch(GERAL, '2026-05-24T21:00:00', 2, 9, 86, 69, 'FINISHED', 'Ginásio PUC Campinas', 130),
  mkMatch(GERAL, '2026-05-31T20:00:00', 1, 2, 84, 80, 'FINISHED', 'Ginásio PUC Campinas', 131),
]
/** Raw global-team roster per seed tournament — the source `services/sportsApi/index.ts` uses
 *  to build `seedTournamentTeams`, and `enrolledTeamCount` below is derived from. */
export const seedEnrollment = [
  { tournamentId: GERAL, teamIds: MOCK_TEAMS.map((t) => t.id) },
  { tournamentId: INVERNO, teamIds: [1, 2, 3, 4, 5, 6, 7, 8] },
]

/** Reverses tournamentTeamId → the raw global team id, via the enrollment table rather than
 *  arithmetic on the synthetic id — keeps this file's reasoning independent of seedIds.ts's formula. */
const teamIdOfEnrollment = (tournamentId: number, tournamentTeamIdValue: number): number | undefined =>
  seedEnrollment
    .find((e) => e.tournamentId === tournamentId)
    ?.teamIds.find((id) => tournamentTeamId(tournamentId, id) === tournamentTeamIdValue)

export const seedBracketRounds = [{ name:'Quartas de final',matches:[{id:'geral-qf1',matchId:125,homeTeamId:1,awayTeamId:5,winnerId:1},{id:'geral-qf4',matchId:128,homeTeamId:13,awayTeamId:10,winnerId:13},{id:'geral-qf2',matchId:126,homeTeamId:6,awayTeamId:2,winnerId:2},{id:'geral-qf3',matchId:127,homeTeamId:9,awayTeamId:14,winnerId:9}]},{name:'Semifinais',matches:[{id:'geral-sf1',matchId:129,homeTeamId:1,awayTeamId:13,winnerId:1},{id:'geral-sf2',matchId:130,homeTeamId:2,awayTeamId:9,winnerId:2}]},{name:'Final',matches:[{id:'geral-f1',matchId:131,homeTeamId:1,awayTeamId:2,winnerId:1}]}]
const geralTournament: Tournament={id:GERAL,name:'Campeonato Geral da PUC 2026',seasonId:1,categoryId:2,format:'GROUP_STAGE_KNOCKOUT',status:'COMPLETED',enrolledTeamCount:seedEnrollment[0].teamIds.length,matchCount:31,finishedMatchCount:31,startDate:'2026-03-01',endDate:'2026-05-31',updatedAt:'2026-05-31T22:00:00',regulation:REGULATION,leaders:geralLeaders,championTournamentTeamId: tournamentTeamId(GERAL, 1)}
const invernoMatches: Match[] = [
  mkMatch(INVERNO, '2026-07-03T19:00:00', 1, 2, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 201),
  mkMatch(INVERNO, '2026-07-05T19:00:00', 1, 3, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 202),
  mkMatch(INVERNO, '2026-07-07T19:00:00', 1, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 203),
  mkMatch(INVERNO, '2026-07-09T19:00:00', 2, 3, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 204),
  mkMatch(INVERNO, '2026-07-11T19:00:00', 2, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 205),
  mkMatch(INVERNO, '2026-07-13T19:00:00', 3, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 206),
  mkMatch(INVERNO, '2026-07-15T19:00:00', 5, 6, null, null, 'SCHEDULED', 'Arena Central PUC', 207),
  mkMatch(INVERNO, '2026-07-17T19:00:00', 5, 7, null, null, 'SCHEDULED', 'Arena Central PUC', 208),
  mkMatch(INVERNO, '2026-07-19T19:00:00', 5, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 209),
  mkMatch(INVERNO, '2026-07-21T19:00:00', 6, 7, null, null, 'SCHEDULED', 'Arena Central PUC', 210),
  mkMatch(INVERNO, '2026-07-23T19:00:00', 6, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 211),
  mkMatch(INVERNO, '2026-07-25T19:00:00', 7, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 212),
  mkMatch(INVERNO, '2026-07-25T19:00:00', 1, 4, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 213),
  mkMatch(INVERNO, '2026-07-25T21:00:00', 5, 8, null, null, 'SCHEDULED', 'Arena Central PUC', 214),
  mkMatch(INVERNO, '2026-07-31T20:00:00', 1, 5, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 215),
]
const invernoTournament: Tournament = { id: INVERNO, name: 'Copa de Inverno PUC', seasonId: 1, categoryId: 2, format: 'GROUP_STAGE_KNOCKOUT', status: 'REGISTRATION', enrolledTeamCount: seedEnrollment[1].teamIds.length, matchCount: 16, finishedMatchCount: 0, startDate: '2026-07-01', endDate: '2026-07-31', updatedAt: '2026-07-01T10:00:00', regulation: REGULATION, leaders: { ppg: [], rpg: [], apg: [], stg: [], bpg: [] }, championTournamentTeamId: null }
export const seedTournaments: Tournament[] = [geralTournament, invernoTournament]

/** Group membership of the demo tournaments, seeded into the store (UI spec §7.4). The
 *  classification itself is not seeded: it is derived from the matches, which already exist. */
export const seedGroupMembership = [
  { tournamentId: GERAL, groupName: 'Grupo A', teamIds: [1, 2, 3, 4] },
  { tournamentId: GERAL, groupName: 'Grupo B', teamIds: [5, 6, 7, 8] },
  { tournamentId: GERAL, groupName: 'Grupo C', teamIds: [9, 10, 11, 12] },
  { tournamentId: GERAL, groupName: 'Grupo D', teamIds: [13, 14, 15, 16] },
  { tournamentId: INVERNO, groupName: 'Grupo A', teamIds: [1, 2, 3, 4] },
  { tournamentId: INVERNO, groupName: 'Grupo B', teamIds: [5, 6, 7, 8] },
]

const seedGroupNameOf = (tournamentId: number, teamId: number): string | null =>
  seedGroupMembership.find((g) => g.tournamentId === tournamentId && g.teamIds.includes(teamId))?.groupName ?? null

/** Stable numeric group ids: Geral A–D → 1–4; Inverno A–B → 5–6. Shared with
 *  `sportsApi/index.ts` so seeded matches and seeded TournamentGroup rows agree. */
const GROUP_IDS: Record<string, number> = {
  '1:Grupo A': 1, '1:Grupo B': 2, '1:Grupo C': 3, '1:Grupo D': 4,
  '2:Grupo A': 5, '2:Grupo B': 6,
}
export function seedGroupId(tournamentId: number, groupName: string): number {
  const id = GROUP_IDS[`${tournamentId}:${groupName}`]
  if (id === undefined) throw new Error(`No seed group id for tournament ${tournamentId} / ${groupName}`)
  return id
}

/** Knockout match ids — bracket games must not get a group id even when both sides share a group
 *  (Inverno's semifinals do). Geral knockout ids come from seedBracketRounds. */
const seedKnockoutMatchIds = new Set([
  ...seedBracketRounds.flatMap((round) => round.matches.map((slot) => slot.matchId)),
  213,
  214,
  215,
])

/** A match belongs to a group only when it is a group-stage game between two teams of the same
 *  group. Knockout ids exclude bracket games. */
const seedGroupIdOf = (match: Match): number | null => {
  if (seedKnockoutMatchIds.has(match.id)) return null
  const homeTeamId = teamIdOfEnrollment(match.tournamentId, match.homeTournamentTeamId)
  const awayTeamId = teamIdOfEnrollment(match.tournamentId, match.awayTournamentTeamId)
  if (homeTeamId === undefined || awayTeamId === undefined) return null
  const home = seedGroupNameOf(match.tournamentId, homeTeamId)
  const away = seedGroupNameOf(match.tournamentId, awayTeamId)
  return home && home === away ? seedGroupId(match.tournamentId, home) : null
}
// Stable scheduled match used to demo/record a súmula (two teams with rostered athletes).
const sumulaSeedMatch = mkMatch(INVERNO, '2026-07-04T19:00:00', 1, 2, null, null, 'SCHEDULED', 'Ginásio PUC Campinas', 216)
const abandonedSeedMatch = mkMatch(3, '2026-07-05T19:00:00', 3, 4, 2, 0, 'FINISHED', 'Ginásio PUC Campinas', 217)
abandonedSeedMatch.awayLossType = 'DEFAULT'
abandonedSeedMatch.scoreSource = 'AWARDED'
const forfeitSeedMatch = mkMatch(3, '2026-07-06T19:00:00', 3, 4, 20, 0, 'FINISHED', 'Ginásio PUC Campinas', 218)
forfeitSeedMatch.awayLossType = 'FORFEIT'
forfeitSeedMatch.scoreSource = 'AWARDED'
export const seedMatches: Match[] = [...geralMatches, ...invernoMatches, sumulaSeedMatch, abandonedSeedMatch, forfeitSeedMatch]
  .map((match) => ({
    ...match,
    tournamentGroupId: seedGroupIdOf(match),
  }))
const MOCK_TOURNAMENTS = seedTournaments
const MOCK_MATCHES = seedMatches
const MATCH_EXTRA = new Map<number, { periodScores: PeriodScore[] | null; homeStats: TeamMatchStats; awayStats: TeamMatchStats; mvp?: MatchMvp }>([
  [217, (() => { const b = buildBoxScore(SEED_TOURNAMENT.FIXTURES, 68, 71, 3, 4); return { periodScores: mkPeriods([17,18], [16,19], [18,17], [17,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [218, { periodScores: [], homeStats: { tournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.FIXTURES, 3), players: [] }, awayStats: { tournamentTeamId: tournamentTeamId(SEED_TOURNAMENT.FIXTURES, 4), players: [] } }],
  [101, (() => { const b = buildBoxScore(GERAL, 80, 89, 1, 2); return { periodScores: mkPeriods([20,22], [23,23], [19,24], [18,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [102, (() => { const b = buildBoxScore(GERAL, 87, 83, 1, 3); return { periodScores: mkPeriods([21,20], [25,22], [21,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [103, (() => { const b = buildBoxScore(GERAL, 94, 77, 1, 4); return { periodScores: mkPeriods([23,19], [26,20], [23,21], [22,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [104, (() => { const b = buildBoxScore(GERAL, 79, 83, 2, 3); return { periodScores: mkPeriods([19,20], [23,22], [19,22], [18,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [105, (() => { const b = buildBoxScore(GERAL, 86, 77, 2, 4); return { periodScores: mkPeriods([21,19], [24,20], [21,21], [20,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [106, (() => { const b = buildBoxScore(GERAL, 91, 88, 3, 4); return { periodScores: mkPeriods([22,22], [26,23], [22,23], [21,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [107, (() => { const b = buildBoxScore(GERAL, 87, 91, 6, 5); return { periodScores: mkPeriods([21,22], [25,24], [21,24], [20,21]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [108, (() => { const b = buildBoxScore(GERAL, 94, 81, 6, 7); return { periodScores: mkPeriods([23,20], [26,21], [23,22], [22,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [109, (() => { const b = buildBoxScore(GERAL, 76, 75, 6, 8); return { periodScores: mkPeriods([19,18], [22,20], [18,20], [17,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [110, (() => { const b = buildBoxScore(GERAL, 80, 81, 5, 7); return { periodScores: mkPeriods([20,20], [23,21], [19,22], [18,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [111, (() => { const b = buildBoxScore(GERAL, 87, 75, 5, 8); return { periodScores: mkPeriods([21,18], [25,20], [21,20], [20,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [112, (() => { const b = buildBoxScore(GERAL, 90, 86, 7, 8); return { periodScores: mkPeriods([22,21], [25,22], [22,23], [21,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [113, (() => { const b = buildBoxScore(GERAL, 88, 90, 9, 10); return { periodScores: mkPeriods([22,22], [25,23], [21,24], [20,21]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [114, (() => { const b = buildBoxScore(GERAL, 70, 79, 9, 11); return { periodScores: mkPeriods([17,19], [20,21], [17,21], [16,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [115, (() => { const b = buildBoxScore(GERAL, 77, 73, 9, 12); return { periodScores: mkPeriods([19,18], [22,19], [19,20], [17,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [116, (() => { const b = buildBoxScore(GERAL, 87, 88, 10, 11); return { periodScores: mkPeriods([21,22], [25,23], [21,23], [20,20]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [117, (() => { const b = buildBoxScore(GERAL, 94, 73, 10, 12); return { periodScores: mkPeriods([23,18], [26,19], [23,20], [22,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [118, (() => { const b = buildBoxScore(GERAL, 89, 84, 11, 12); return { periodScores: mkPeriods([22,21], [25,22], [22,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [119, (() => { const b = buildBoxScore(GERAL, 92, 96, 13, 14); return { periodScores: mkPeriods([23,24], [26,25], [22,25], [21,22]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [120, (() => { const b = buildBoxScore(GERAL, 74, 77, 13, 15); return { periodScores: mkPeriods([18,19], [21,20], [18,21], [17,17]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [121, (() => { const b = buildBoxScore(GERAL, 81, 71, 13, 16); return { periodScores: mkPeriods([20,17], [23,19], [20,19], [18,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [122, (() => { const b = buildBoxScore(GERAL, 91, 94, 14, 15); return { periodScores: mkPeriods([22,23], [26,24], [22,25], [21,22]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [123, (() => { const b = buildBoxScore(GERAL, 73, 71, 14, 16); return { periodScores: mkPeriods([18,17], [21,19], [18,19], [16,16]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [124, (() => { const b = buildBoxScore(GERAL, 83, 82, 15, 16); return { periodScores: mkPeriods([20,20], [24,21], [20,22], [19,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [125, (() => { const b = buildBoxScore(GERAL, 86, 82, 1, 5); return { periodScores: mkPeriods([21,20], [24,21], [21,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [126, (() => { const b = buildBoxScore(GERAL, 70, 78, 6, 2); return { periodScores: mkPeriods([17,19], [20,20], [17,21], [16,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [127, (() => { const b = buildBoxScore(GERAL, 86, 83, 9, 14); return { periodScores: mkPeriods([21,20], [24,22], [21,22], [20,19]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [128, (() => { const b = buildBoxScore(GERAL, 84, 81, 13, 10); return { periodScores: mkPeriods([21,20], [24,21], [20,22], [19,18]), homeStats: b.homeStats, awayStats: b.awayStats }; })()],
  [129, (() => { const b = buildBoxScore(GERAL, 82, 78, 1, 13); return { periodScores: mkPeriods([20,19], [23,20], [20,21], [19,18]), homeStats: disableColumns(b.homeStats, ['blk']), awayStats: b.awayStats }; })()],
  [130, (() => { const b = buildBoxScore(GERAL, 86, 69, 2, 9); return { periodScores: mkPeriods([21,17], [24,18], [21,19], [20,15]), homeStats: disableColumns(b.homeStats, SHOOTING_FIELDS), awayStats: b.awayStats }; })()],
])

const FINAL_HOME = mkTeam(tournamentTeamId(GERAL, 1), [
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 101)!, 38, 24, 5, 6, 2, 0, 2, 2, 9, 17, 2, 5, 4, 5),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 102)!, 36, 18, 4, 3, 1, 1, 1, 3, 7, 14, 1, 4, 3, 4),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 103)!, 34, 14, 8, 2, 0, 2, 2, 3, 5, 10, 0, 1, 4, 5),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 104)!, 32, 12, 3, 5, 2, 0, 1, 2, 4, 9, 2, 5, 2, 2),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 105)!, 28, 10, 6, 1, 1, 0, 1, 2, 4, 8, 0, 2, 2, 3),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 106)!, 22,  4, 4, 2, 0, 0, 1, 1, 2, 5, 0, 1, 0, 0),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 107)!, 20,  2, 3, 1, 0, 0, 0, 1, 1, 3, 0, 1, 0, 0),
])
const FINAL_AWAY = mkTeam(tournamentTeamId(GERAL, 2), [
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 109)!, 38, 22, 4, 4, 2, 0, 3, 2, 8, 16, 2, 6, 4, 5),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 110)!, 36, 16, 5, 3, 1, 1, 2, 3, 6, 12, 1, 4, 3, 4),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 111)!, 34, 14, 7, 2, 0, 1, 1, 2, 5, 10, 1, 3, 3, 4),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 112)!, 32, 12, 3, 5, 2, 0, 2, 2, 4, 9, 2, 5, 2, 2),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 113)!, 28, 10, 5, 1, 0, 0, 1, 3, 4, 8, 0, 2, 2, 3),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 114)!, 24,  4, 4, 1, 0, 0, 1, 1, 2, 5, 0, 1, 0, 0),
  mkPlayer(GERAL, PUC_ATHLETES.find((a) => a.id === 115)!, 18,  2, 2, 1, 0, 0, 0, 1, 1, 3, 0, 1, 0, 0),
])
MATCH_EXTRA.set(131, { periodScores: mkPeriods([22,20],[18,22],[20,18],[16,16],[8,4]), homeStats: FINAL_HOME, awayStats: FINAL_AWAY, mvp: { tournamentRosterId: seedRosterId(GERAL, 101), athleteId: 101 } })

export function getTeams(): Team[] { return MOCK_TEAMS }
export function getTournaments(): Tournament[] { return MOCK_TOURNAMENTS }
export function getTournamentById(id: number): Tournament | undefined { return MOCK_TOURNAMENTS.find((c) => c.id === id) }
export function getMatchesByTournament(tournamentId: number): Match[] { return MOCK_MATCHES.filter((m) => m.tournamentId === tournamentId) }
export function getSeasons(): Season[] { return seedSeasons }
export function getCategories(): TournamentCategory[] { return seedCategories }
export function getSeasonLabel(seasonId: number): string { return seedSeasons.find((s) => s.id === seasonId)?.label ?? String(seasonId) }
export function getCategoryName(categoryId: number | null): string { return categoryId ? (seedCategories.find((c) => c.id === categoryId)?.name ?? String(categoryId)) : '—' }
export function getAllMatches(): Match[] { return MOCK_MATCHES }
export function getMatchDetailById(id: number): MatchDetail | undefined { const match = MOCK_MATCHES.find((m) => m.id === id); if (!match) return undefined; const extra = MATCH_EXTRA.get(id); return { ...match, periodScores: extra?.periodScores ?? null, homeStats: extra?.homeStats ?? { tournamentTeamId: match.homeTournamentTeamId, players: [] }, awayStats: extra?.awayStats ?? { tournamentTeamId: match.awayTournamentTeamId, players: [] }, mvp: extra?.mvp ?? null } }
export const MOCK_ATHLETES: Athlete[] = PUC_ATHLETES
export function getAthletes(): Athlete[] { return MOCK_ATHLETES }
export function getAthleteById(athleteId: number): Athlete | undefined { return MOCK_ATHLETES.find((a) => a.id === athleteId) }
function getAthleteAppearances(athleteId?: number) { return [...MATCH_EXTRA.entries()].flatMap(([matchId, extra]) => { const match = MOCK_MATCHES.find((item) => item.id === matchId); if (!match) return []; const home = extra.homeStats.players.filter((p) => !athleteId || p.athleteId === athleteId).map((p) => ({ player: p, tournamentTeamId: extra.homeStats.tournamentTeamId, match })); const away = extra.awayStats.players.filter((p) => !athleteId || p.athleteId === athleteId).map((p) => ({ player: p, tournamentTeamId: extra.awayStats.tournamentTeamId, match })); return [...home, ...away] }) }
export function getAthleteMatches(athleteId: number): AthleteMatchStatsRow[] { return getAthleteAppearances(athleteId).map(({ player, tournamentTeamId: entryTournamentTeamId, match }) => { const tournament = getTournamentById(match.tournamentId); const homeTeamId = teamIdOfEnrollment(match.tournamentId, match.homeTournamentTeamId); const awayTeamId = teamIdOfEnrollment(match.tournamentId, match.awayTournamentTeamId); const homeTeam = homeTeamId !== undefined ? MOCK_TEAMS.find((t) => t.id === homeTeamId) : undefined; const awayTeam = awayTeamId !== undefined ? MOCK_TEAMS.find((t) => t.id === awayTeamId) : undefined; const athleteIsHome = entryTournamentTeamId === match.homeTournamentTeamId; const athleteScore = athleteIsHome ? match.homeScore : match.awayScore; const opponentScore = athleteIsHome ? match.awayScore : match.homeScore; const scoreText = athleteScore === null || opponentScore === null ? '—' : `${athleteScore > opponentScore ? 'V' : 'D'} ${athleteScore}-${opponentScore}`; if (!tournament) return null; const teamName = (athleteIsHome ? homeTeam : awayTeam)?.name ?? String(entryTournamentTeamId); return { match, tournament, tournamentTeamId: entryTournamentTeamId, teamName, matchup: `${homeTeam?.name ?? match.homeTournamentTeamId} × ${awayTeam?.name ?? match.awayTournamentTeamId}`, result: scoreText, stats: player } }).filter((row): row is AthleteMatchStatsRow => Boolean(row)).sort((a, b) => +new Date(b.match.date) - +new Date(a.match.date)) }
export function getAthleteSummaryById(athleteId: number): AthleteStatTotals { return aggregateAthleteStats(getAthleteMatches(athleteId).map((row) => row.stats)) }
export function getAthleteTournamentStats(athleteId: number): AthleteTournamentStatsRow[] { const grouped = new Map<string, AthleteMatchStatsRow[]>(); getAthleteMatches(athleteId).forEach((row) => { const key = `${row.tournament.id}:${row.tournamentTeamId}`; grouped.set(key, [...(grouped.get(key) ?? []), row]) }); return [...grouped.values()].map((rows) => ({ tournament: rows[0].tournament, tournamentTeamId: rows[0].tournamentTeamId, teamName: rows[0].teamName, totals: aggregateAthleteStats(rows.map((row) => row.stats)) })).sort((a, b) => +new Date(b.tournament.startDate) - +new Date(a.tournament.startDate)) }
