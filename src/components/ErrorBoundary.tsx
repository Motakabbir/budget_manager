import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });

        // You can log to an error reporting service here
        // Example: Sentry.captureException(error);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
                    <Card className="max-w-lg w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-destructive/10 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-destructive" />
                                </div>
                                <CardTitle className="text-2xl">Something went wrong</CardTitle>
                            </div>
                            <CardDescription>
                                We're sorry, but something unexpected happened. Don't worry, your data is
                                safe.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-sm">
                                    <summary className="cursor-pointer font-medium mb-2">
                                        Error Details (Development Only)
                                    </summary>
                                    <div className="bg-muted p-3 rounded-md overflow-auto max-h-64">
                                        <p className="font-semibold text-destructive">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <pre className="mt-2 text-xs whitespace-pre-wrap">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            )}

                            <div className="flex gap-3">
                                <Button onClick={this.handleReset} className="flex-1">
                                    Return to Dashboard
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                    className="flex-1"
                                >
                                    Reload Page
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                If this problem persists, please try signing out and signing back in, or
                                contact support.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
