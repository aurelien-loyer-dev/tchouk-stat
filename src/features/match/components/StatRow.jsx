import Icon from '../../../components/Icon'
import Animated from './Animated'

export default function StatRow({ label, count, color, onInc, onDec }) {
  const cls = ['row', color && `stat-${color}`].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="rl"><span className="stat-chip" aria-hidden="true" />{label}</div>
      <button className="ab m" onClick={onDec} aria-label={`${label} −1`} disabled={!count}>
        <Icon name="minus" size={20} />
      </button>
      <Animated value={count} className="rv" />
      <button className="ab p" onClick={onInc} aria-label={`${label} +1`}>
        <Icon name="plus" size={22} />
      </button>
    </div>
  )
}
