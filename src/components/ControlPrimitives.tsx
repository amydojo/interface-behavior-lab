import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Tone = 'quiet' | 'primary' | 'success' | 'attention' | 'ethical' | 'exploratory'

type AdaptiveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  metadata: string
  tone?: Tone
  stateName: string
  signal?: ReactNode
}

export const AdaptiveButton = forwardRef<HTMLButtonElement, AdaptiveButtonProps>(function AdaptiveButton({
  label,
  metadata,
  tone = 'quiet',
  stateName,
  signal,
  className = '',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      className={`adaptive-button tone-${tone} ${className}`}
      data-state={stateName}
      {...props}
    >
      <span className="adaptive-copy">
        <span className="adaptive-label">{label}</span>
        <span className="adaptive-meta">{metadata}</span>
      </span>
      <span className="adaptive-signal" aria-hidden="true">
        {signal}
      </span>
    </button>
  )
})

type DemoCardProps = {
  number: string
  family: string
  value: string
  description: string
  modalities: string[]
  children: ReactNode
  footer: string
}

export function DemoCard({ number, family, value, description, modalities, children, footer }: DemoCardProps) {
  return (
    <article className={`demo-card family-${family.toLowerCase()}`}>
      <header className="demo-header">
        <div className="demo-index">{number}</div>
        <div>
          <h2>{family}</h2>
          <p className="demo-value">{value}</p>
        </div>
      </header>
      <p className="demo-description">{description}</p>
      <div className="modality-tags" aria-label="Supported input modalities">
        {modalities.map((item, index) => (
          <span className={index === 0 ? 'is-primary' : ''} key={item}>{item}</span>
        ))}
      </div>
      <div className="demo-stage">{children}</div>
      <footer className="demo-footer">{footer}</footer>
    </article>
  )
}

export function MeterBars({ active, total = 3 }: { active: number; total?: number }) {
  return (
    <span className="meter-bars">
      {Array.from({ length: total }, (_, index) => (
        <i key={index} className={index < active ? 'is-active' : ''} />
      ))}
    </span>
  )
}
