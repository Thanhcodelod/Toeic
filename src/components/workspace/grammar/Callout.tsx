import { Lightbulb } from 'lucide-react'

interface CalloutProps {
  text: string
}

/**
 * Highlighted TOEIC-tip box. If the tip starts with a "LABEL:" prefix
 * (e.g. "MẸO TOEIC:"), that label is emphasised.
 */
export function Callout({ text }: CalloutProps) {
  const separator = text.indexOf(':')
  const hasLabel = separator > 0 && separator < 24
  const label = hasLabel ? text.slice(0, separator) : null
  const body = hasLabel ? text.slice(separator + 1).trim() : text

  return (
    <div className="lift flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
      <p className="text-sm leading-relaxed text-amber-900">
        {label && <span className="font-bold">{label}: </span>}
        {body}
      </p>
    </div>
  )
}
