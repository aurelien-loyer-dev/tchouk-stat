import Animated from './Animated'

export default function StatRow({ label, count, hl, color, onInc, onDec }) {
  const cls = ['row', hl && 'hl', color && `row-${color}`].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="rl">{label}</div>
      <Animated value={count} className="rv" />
      <button className="ab m" onClick={onDec}>−</button>
      <button className="ab p" onClick={onInc}>+</button>
    </div>
  )
}
