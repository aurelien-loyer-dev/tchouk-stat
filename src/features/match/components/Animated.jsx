import { useEffect, useRef } from 'react'

// Bump CSS quand la valeur change
export default function Animated({ value, className, style }) {
  const ref  = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove('bump')
      void ref.current.offsetWidth
      ref.current.classList.add('bump')
    }
    prev.current = value
  }, [value])
  return <div className={className} style={style} ref={ref}>{value}</div>
}
