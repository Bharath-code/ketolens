/**
 * ErrorBoundary
 * Catches JavaScript errors in child components and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '../atoms';
import { Colors, Spacing } from '../../constants/theme';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to console for now, can integrate Sentry later
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo.componentStack);

        // TODO: Send to Sentry
        // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.content}>
                        <Text variant="heading" size="4xl" align="center">😵</Text>
                        <Text variant="heading" size="xl" align="center" style={styles.title}>
                            Something went wrong
                        </Text>
                        <Text variant="body" color={Colors.gray500} align="center" style={styles.message}>
                            We hit an unexpected error. Please try again.
                        </Text>

                        <Button
                            variant="primary"
                            onPress={this.handleRetry}
                            containerStyle={styles.button}
                        >
                            Try Again
                        </Button>

                        {__DEV__ && this.state.error && (
                            <View style={styles.debugInfo}>
                                <Text variant="caption" color={Colors.ketoAvoid}>
                                    {this.state.error.message}
                                </Text>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing['2xl'],
    },
    title: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },
    message: {
        marginBottom: Spacing['2xl'],
        maxWidth: 280,
    },
    button: {
        minWidth: 160,
    },
    debugInfo: {
        marginTop: Spacing['2xl'],
        padding: Spacing.lg,
        backgroundColor: Colors.gray50,
        borderRadius: 8,
        maxWidth: '100%',
    },
});
