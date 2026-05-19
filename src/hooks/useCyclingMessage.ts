import { useEffect, useState } from 'react'

export function useCyclingMessage(
  active: boolean,
  messages: readonly string[],
  intervalMs = 5000
): string | null {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active || messages.length === 0) {
      setIndex(0)
      return
    }

    setIndex(Math.floor(Math.random() * messages.length))
    const id = setInterval(() => {
      setIndex(i => (i + 1) % messages.length)
    }, intervalMs)

    return () => clearInterval(id)
  }, [active, messages, intervalMs])

  if (!active || messages.length === 0) return null
  return messages[index]!
}
