import React from 'react'
import {
    TextInput,
    StyleSheet,
    View,
    TextStyle,
    ViewStyle,
    TextInputProps,
} from 'react-native'
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../../constants/theme'
import { Text } from './Text'

interface InputProps extends TextInputProps {
    label?: string
    error?: string
    containerStyle?: ViewStyle
    inputStyle?: TextStyle
}

export function Input({
    label,
    error,
    containerStyle,
    inputStyle,
    ...props
}: InputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text variant="caption" weight="medium" style={styles.label}>
                    {label}
                </Text>
            )}
            <TextInput
                style={[
                    styles.input,
                    error ? styles.inputError : null,
                    inputStyle,
                ]}
                placeholderTextColor={Colors.gray400}
                {...props}
            />
            {error && (
                <Text variant="caption" color={Colors.ketoAvoid} style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
        width: '100%',
    },
    label: {
        marginBottom: Spacing.xs,
        color: Colors.gray600,
    },
    input: {
        backgroundColor: Colors.gray50,
        borderWidth: 1,
        borderColor: Colors.gray200,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: FontSize.base,
        color: Colors.gray900,
        minHeight: 48,
    },
    inputError: {
        borderColor: Colors.ketoAvoid,
    },
    errorText: {
        marginTop: Spacing.xs,
    },
})
