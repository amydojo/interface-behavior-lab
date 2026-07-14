import type { ReactNode } from 'react'
import { DemoCard } from '../components/ControlPrimitives'
import type { ExperimentMetadata } from './types'

type Props = {
  definition: ExperimentMetadata
  children: ReactNode
}

export function ExperimentCard({ definition, children }: Props) {
  return (
    <DemoCard
      number={String(definition.order).padStart(2, '0')}
      family={definition.family}
      value={definition.value}
      description={definition.description}
      modalities={definition.supportedInputContexts.map(context => context.toUpperCase())}
      footer={definition.implementationNote}
    >
      {children}
    </DemoCard>
  )
}
