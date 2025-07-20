'use client';

import React from 'react';
import { PlasmicComponent } from "@plasmicapp/loader-nextjs";

interface PlasmicErrorBoundaryProps {
  component: string;
  prefetchedData: any;
  pageParams?: any;
  pageQuery?: any;
}

interface PlasmicErrorBoundaryState {
  hasError: boolean;
  retryCount: number;
}

export class PlasmicErrorBoundary extends React.Component<PlasmicErrorBoundaryProps, PlasmicErrorBoundaryState> {
  constructor(props: PlasmicErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Plasmic component error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="plasmic-error-container">
          <h2>Something went wrong loading this content.</h2>
          <button 
            onClick={this.handleRetry}
            className="plasmic-retry-button"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <PlasmicComponent
        key={this.state.retryCount}
        component={this.props.component}
        prefetchedData={this.props.prefetchedData}
        pageParams={this.props.pageParams}
        pageQuery={this.props.pageQuery}
      />
    );
  }
} 