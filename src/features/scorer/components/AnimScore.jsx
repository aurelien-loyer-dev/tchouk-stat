import { useEffect, useRef } from 'react'
import { teamTextStyle } from '../../../lib/teamColor'

export default function AnimScore({ value, color }) {
  const ref  = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove('sc-bump')
      void ref.current.offsetWidth
      ref.current.classList.add('sc-bump')
    }
    prev.current = value
  }, [value])
  return <div ref={ref} className="sc-score" style={teamTextStyle(color)}>{value}</div>
}
