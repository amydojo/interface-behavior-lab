import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = {
  name: string
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class SpecimenBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`Interface Behavior Lab: ${this.props.name} failed to render.`, error, info)
    }
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section className="specimen-error" role="alert" aria-labelledby={`specimen-error-${this.props.name}`}>
        <span>SPECIMEN OFFLINE</span>
        <h2 id={`specimen-error-${this.props.name}`}>{this.props.name} could not be rendered.</h2>
        <p>The rest of the laboratory remains available. Reset this specimen to try again.</p>
        <button type="button" onClick={this.reset}>Reset specimen</button>
      </section>
    )
  }
}
