import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import './FlipCard.css'

const spring = { stiffness: 220, damping: 24, mass: .7 }

export default function FlipCard({ front, back, width = 400, height = 390, radius = 16, ariaLabel = 'Girar tarjeta' }) {
  const reduced = useReducedMotion()
  const [flipped, setFlipped] = useState(false)
  const turn = useMotionValue(0)
  const tiltX = useSpring(0, spring)
  const tiltY = useSpring(0, spring)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const sumY = useTransform([turn, tiltY], ([rotation, tilt]) => rotation + tilt)
  const transform = useMotionTemplate`perspective(1100px) rotateX(${tiltX}deg) rotateY(${sumY}deg)`
  const gxPercent = useMotionTemplate`${gx}%`
  const gyPercent = useMotionTemplate`${gy}%`

  useEffect(() => {
    const controls = animate(turn, flipped ? 180 : 0, reduced ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 22 })
    return () => controls.stop()
  }, [flipped, reduced, turn])

  const move = event => {
    if (reduced || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    tiltX.set((.5 - y) * 8)
    tiltY.set((x - .5) * 8)
    gx.set(x * 100)
    gy.set(y * 100)
  }
  const rest = () => { tiltX.set(0); tiltY.set(0) }

  return <motion.button type="button" className="flip-card" style={{ '--fc-w': `${width}px`, '--fc-h': `${height}px`, '--fc-radius': `${radius}px`, '--fc-gx': gxPercent, '--fc-gy': gyPercent }} aria-label={ariaLabel} aria-pressed={flipped} onClick={() => setFlipped(value => !value)} onPointerMove={move} onPointerLeave={rest}>
    <motion.span className="flip-card__rotor" style={reduced ? undefined : { transform }}>
      <span className="flip-card__face flip-card__face--front" aria-hidden={flipped}>{front}<span className="flip-card__glare" aria-hidden="true"/></span>
      <span className="flip-card__face flip-card__face--back" aria-hidden={!flipped}>{back}<span className="flip-card__glare" aria-hidden="true"/></span>
    </motion.span>
  </motion.button>
}
