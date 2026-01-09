import React, { useState, useCallback } from 'react'
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    TextInput,
} from 'react-native'
import { Screen } from '../components/layout/Screen'
import { Button, Text, Input } from '../components/atoms'
import { Colors, Spacing, BorderRadius } from '../constants/theme'
import { MotiView } from 'moti'
import { haptics } from '../services/hapticsService'

const { width } = Dimensions.get('window')

interface Question {
    id: number
    title: string
    options?: string[]
    type: 'options' | 'input'
    unitOptions?: string[]
    placeholder?: string
}

const QUESTIONS: Question[] = [
    {
        id: 1,
        title: "What's your gender?",
        options: ['Male', 'Female', 'Non-binary'],
        type: 'options'
    },
    {
        id: 2,
        title: "How old are you?",
        type: 'input',
        placeholder: 'Age'
    },
    {
        id: 3,
        title: "What's your weight?",
        type: 'input',
        unitOptions: ['kg', 'lbs'],
        placeholder: '00'
    },
    {
        id: 4,
        title: "What's your height?",
        type: 'input',
        unitOptions: ['cm', 'ft'],
        placeholder: '00'
    },
    {
        id: 5,
        title: "Activity Level?",
        options: ['Sedentary', 'Lightly Active', 'Very Active'],
        type: 'options'
    },
    {
        id: 6,
        title: "What's your goal?",
        options: ['Lose Weight', 'Maintain', 'Build Muscle'],
        type: 'options'
    },
    {
        id: 7,
        title: "Keto Knowledge?",
        options: ['Beginner', 'Intermediate', 'Pro'],
        type: 'options'
    }
]

interface QuizScreenProps {
    onComplete: (data: any) => void
}

// Validation rules per question
const VALIDATION = {
    2: { min: 13, max: 120, error: 'Age must be 13-120' }, // Age
    3: { // Weight
        kg: { min: 30, max: 300, error: 'Weight must be 30-300 kg' },
        lbs: { min: 66, max: 660, error: 'Weight must be 66-660 lbs' }
    },
    4: { // Height
        cm: { min: 100, max: 250, error: 'Height must be 100-250 cm' },
        ft: { min: 3, max: 8, error: 'Height must be 3-8 ft' }
    }
}

export function QuizScreen({ onComplete }: QuizScreenProps) {
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState<Record<number, any>>({})
    const [inputValue, setInputValue] = useState('')
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
    const [error, setError] = useState('')

    const currentQuestion = QUESTIONS[step]

    const validateInput = useCallback((): boolean => {
        const value = parseFloat(inputValue)
        if (isNaN(value)) {
            setError('Please enter a valid number')
            return false
        }

        const questionId = currentQuestion.id
        const rules = VALIDATION[questionId as keyof typeof VALIDATION]

        if (rules) {
            if ('min' in rules) {
                // Simple validation (age)
                if (value < rules.min || value > rules.max) {
                    setError(rules.error)
                    return false
                }
            } else {
                // Unit-based validation (weight/height)
                const unit = selectedUnit || currentQuestion.unitOptions?.[0] || ''
                const unitRules = rules[unit as keyof typeof rules] as { min: number; max: number; error: string }
                if (unitRules && (value < unitRules.min || value > unitRules.max)) {
                    setError(unitRules.error)
                    return false
                }
            }
        }

        setError('')
        return true
    }, [inputValue, selectedUnit, currentQuestion])

    const handleNext = useCallback((value?: any) => {
        // Validate input questions before proceeding
        if (currentQuestion.type === 'input' && value === undefined) {
            if (!validateInput()) {
                haptics.error()
                return
            }
        }

        const finalValue = value !== undefined ? value : inputValue
        const currentData = currentQuestion.unitOptions
            ? { value: finalValue, unit: selectedUnit || currentQuestion.unitOptions[0] }
            : finalValue

        const newAnswers = { ...answers, [currentQuestion.id]: currentData }
        setAnswers(newAnswers)
        setInputValue('')
        setSelectedUnit(null)
        setError('')

        if (step < QUESTIONS.length - 1) {
            setStep(step + 1)
        } else {
            // Map keys to human readable for consistency if needed, 
            // but for now we'll pass the raw answers object
            onComplete(newAnswers)
        }
    }, [step, answers, inputValue, selectedUnit, currentQuestion, validateInput])

    const progress = ((step + 1) / QUESTIONS.length) * 100

    return (
        <Screen padding={false} scrollable={false}>
            <View style={styles.container}>
                <View style={styles.progressBarContainer}>
                    <MotiView
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'timing', duration: 500 }}
                        style={styles.progressBar}
                    />
                </View>

                <View style={styles.content}>
                    <Text variant="caption" color={Colors.gray500} style={styles.stepIndicator}>
                        Step {step + 1} of {QUESTIONS.length}
                    </Text>
                    <Text variant="heading" style={styles.questionTitle}>
                        {currentQuestion.title}
                    </Text>

                    {currentQuestion.type === 'options' ? (
                        <View style={styles.optionsContainer}>
                            {currentQuestion.options?.map((option, index) => (
                                <MotiView
                                    key={`${step}-${option}`}
                                    from={{ opacity: 0, translateY: 10 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ type: 'timing', duration: 300, delay: index * 100 }}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            answers[currentQuestion.id] === option && styles.optionButtonActive
                                        ]}
                                        onPress={() => {
                                            haptics.light()
                                            handleNext(option)
                                        }}
                                    >
                                        <Text
                                            variant="body"
                                            weight="medium"
                                            color={answers[currentQuestion.id] === option ? Colors.white : Colors.gray800}
                                        >
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                </MotiView>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.largeInput}
                                    value={inputValue}
                                    onChangeText={(text) => {
                                        setInputValue(text)
                                        if (error) setError('')
                                    }}
                                    placeholder={currentQuestion.placeholder}
                                    keyboardType="numeric"
                                    autoFocus={false}
                                    placeholderTextColor={Colors.gray300}
                                />
                                {currentQuestion.unitOptions && (
                                    <View style={styles.unitPicker}>
                                        {currentQuestion.unitOptions.map((unit) => (
                                            <TouchableOpacity
                                                key={unit}
                                                style={[
                                                    styles.unitButton,
                                                    (selectedUnit === unit || (!selectedUnit && currentQuestion.unitOptions![0] === unit)) && styles.unitButtonActive
                                                ]}
                                                onPress={() => {
                                                    haptics.light()
                                                    setSelectedUnit(unit)
                                                }}
                                            >
                                                <Text
                                                    variant="caption"
                                                    weight="bold"
                                                    color={(selectedUnit === unit || (!selectedUnit && currentQuestion.unitOptions![0] === unit)) ? Colors.white : Colors.gray500}
                                                >
                                                    {unit.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {error ? (
                                <Text variant="caption" color={Colors.ketoAvoid} style={styles.errorText}>
                                    {error}
                                </Text>
                            ) : null}

                            <Button
                                onPress={() => handleNext()}
                                disabled={!inputValue}
                                containerStyle={styles.continueBtn}
                                fullWidth
                            >
                                Continue
                            </Button>
                        </View>
                    )}
                </View>

                {step > 0 && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setStep(step - 1)}
                    >
                        <Text variant="caption" color={Colors.gray400}>Go Back</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Screen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: Colors.gray100,
        width: '100%',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.ketoSafe,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    stepIndicator: {
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    questionTitle: {
        marginBottom: Spacing['3xl'],
        fontSize: 28,
    },
    optionsContainer: {
        gap: Spacing.md,
    },
    optionButton: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.gray50,
        borderWidth: 1,
        borderColor: Colors.gray200,
    },
    optionButtonActive: {
        backgroundColor: Colors.ketoSafe,
        borderColor: Colors.ketoSafe,
    },
    backButton: {
        padding: 24,
        alignItems: 'center',
    },
    inputContainer: {
        marginTop: Spacing.xl,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.gray50,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing['2xl'],
        borderWidth: 1,
        borderColor: Colors.gray200,
    },
    largeInput: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.gray900,
        flex: 1,
    },
    unitPicker: {
        flexDirection: 'row',
        backgroundColor: Colors.gray200,
        borderRadius: BorderRadius.lg,
        padding: 4,
    },
    unitButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
    },
    unitButtonActive: {
        backgroundColor: Colors.ketoSafe,
    },
    continueBtn: {
        marginTop: Spacing.xl,
    },
    errorText: {
        marginTop: -Spacing.lg,
        marginBottom: Spacing.md,
    },
})
