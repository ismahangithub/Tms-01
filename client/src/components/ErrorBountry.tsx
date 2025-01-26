// src/components/ErrorBoundary.tsx

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
        this.handleReload = this.handleReload.bind(this);
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Update state so the next render shows the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can log the error to an error reporting service here
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });

        // Example: Integrate with an error reporting service like Sentry
        // Sentry.captureException(error, { extra: errorInfo });
    }

    handleReload() {
        // Reload the application
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="p-6 max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-md shadow-md"
                    role="alert"
                >
                    <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong.</h2>
                    <p className="text-red-600 mb-2">
                        An unexpected error has occurred. Please try reloading the page.
                    </p>
                    {this.state.error && (
                        <details className="whitespace-pre-wrap text-sm text-red-500">
                            {this.state.error.toString()}
                            <br />
                            {this.state.errorInfo?.componentStack}
                        </details>
                    )}
                    <button
                        onClick={this.handleReload}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
