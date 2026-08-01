import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui'
import styles from './MatchSumulaPage.module.css'

export function MatchSumulaPage() {
  const { matchId } = useParams()

  return (
    <main className={styles.page}>
      <EmptyState
        title="Lançamento de resultado indisponível"
        description="Lançamento de resultado estará disponível após a integração da Fase 9."
        action={matchId ? <Link to={`/matches/${matchId}`}>Voltar para a partida</Link> : undefined}
      />
    </main>
  )
}
