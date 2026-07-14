import type { ReactNode } from 'react'
import { DemoCard } from '../components/ControlPrimitives'
import type { ExperimentMetadata } from './types'

type Props = {
  definition: ExperimentMetadata
  children: ReactNode
  footer?: string
}

export function ExperimentCard({ definition, children, footer = definition.implementationNote }: Props) {
  return (
    <DemoCard
      number={String(definition.order).padStart(2, '0')}
      family={definition.displayName}
      value={definition.value}
      description={definition.description}
      modalities={definition.supportedInputContexts.map(context => context.toUpperCase())}
      footer={footer}
    >
      {children}
    </DemoCard>
  )
}
