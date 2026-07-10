export default function VoiceAnimation({ active }) {
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="absolute h-20 w-20 rounded-full bg-brand-400/40 animate-pulseRing" />
      <span className="absolute h-20 w-20 rounded-full bg-brand-400/30 animate-pulseRing [animation-delay:0.4s]" />
    </div>
  )
}
