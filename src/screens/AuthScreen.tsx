import React, { useState, useCallback } from 'react'
import {
    View,
    StyleSheet,
    Alert,
    TouchableOpacity,
} from 'react-native'
import { Screen } from '../components/layout/Screen'
import { Button, Text, Input } from '../components/atoms'
import { Colors, Spacing, FontSize } from '../constants/theme'
import { supabase } from '../services/supabase'

export function AuthScreen() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email)
    }

    const handleAuth = useCallback(async () => {
        // Reset errors
        setEmailError('')
        setPasswordError('')

        // Guardrails
        if (loading) return

        let hasError = false
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address')
            hasError = true
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters')
            hasError = true
        }

        if (hasError) return

        setLoading(true)
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                Alert.alert('Success', 'Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            }
        } catch (error: any) {
            Alert.alert('Authentication Error', error.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [email, password, isSignUp, loading])

    const handleGoogleAuth = useCallback(async () => {
        Alert.alert('Google Auth', 'Google authentication is being configured. Please use email for now.')
    }, [])

    return (
        <Screen padding={false} scrollable={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text variant="display" align="center" style={styles.title}>
                        KetoLens
                    </Text>
                    <Text variant="body" align="center" color={Colors.gray500}>
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email"
                        placeholder="your@email.com"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text)
                            if (emailError) setEmailError('')
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={emailError}
                    />
                    <Input
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text)
                            if (passwordError) setPasswordError('')
                        }}
                        secureTextEntry
                        error={passwordError}
                    />

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                        onPress={handleAuth}
                        containerStyle={styles.submitBtn}
                    >
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                    </Button>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text variant="caption" color={Colors.gray400} style={styles.dividerText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onPress={handleGoogleAuth}
                    >
                        Continue with Google
                    </Button>

                    <TouchableOpacity
                        onPress={() => setIsSignUp(!isSignUp)}
                        style={styles.toggleContainer}
                    >
                        <Text variant="caption" color={Colors.gray600}>
                            {isSignUp
                                ? 'Already have an account? '
                                : "Don't have an account? "}
                            <Text variant="caption" weight="bold" color={Colors.ketoSafe}>
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Screen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: Spacing['5xl'],
    },
    title: {
        marginBottom: Spacing.xs,
        letterSpacing: -1,
    },
    form: {
        width: '100%',
    },
    submitBtn: {
        marginTop: Spacing.lg,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing['2xl'],
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.gray200,
    },
    dividerText: {
        marginHorizontal: Spacing.md,
    },
    toggleContainer: {
        marginTop: Spacing['2xl'],
        alignItems: 'center',
    },
})
