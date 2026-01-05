import React, { useState, useCallback } from 'react'
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native'
import { Screen } from '../components/layout/Screen'
import { Button, Text } from '../components/atoms'
import { Colors, Spacing, BorderRadius } from '../constants/theme'

const { width } = Dimensions.get('window')

interface Question {
    id: number
    title: string
    options: string[]
}

const QUESTIONS: Question[] = [
    {
        id: 1,
        title: "What's your gender?",
        options: ['Male', 'Female', 'Non-binary']
    },
    {
        id: 2,
        title: "Activity Level?",
        options: ['Sedentary', 'Lightly Active', 'Very Active']
    },
    {
        id: 3,
        title: "What's your goal?",
        options: ['Lose Weight', 'Maintain', 'Build Muscle']
    },
    {
        id: 4,
        title: "Keto Knowledge?",
        options: ['Beginner', 'Intermediate', 'Pro']
    }
]

interface QuizScreenProps {
    onComplete: (data: any) => void
}

export function QuizScreen({ onComplete }: QuizScreenProps) {
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})

    const currentQuestion = QUESTIONS[step]

    const handleSelect = (option: string) => {
        const newAnswers = { ...answers, [currentQuestion.id]: option }
        setAnswers(newAnswers)

        if (step < QUESTIONS.length - 1) {
            setStep(step + 1)
        } else {
            onComplete(newAnswers)
        }
    }

    const progress = ((step + 1) / QUESTIONS.length) * 100

    return (
        <Screen padding={false} scrollable={false}>
            <View style={styles.container}>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>

                <View style={styles.content}>
                    <Text variant="caption" color={Colors.gray500} style={styles.stepIndicator}>
                        Step {step + 1} of {QUESTIONS.length}
                    </Text>
                    <Text variant="heading" style={styles.questionTitle}>
                        {currentQuestion.title}
                    </Text>

                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.optionButton,
                                    answers[currentQuestion.id] === option && styles.optionButtonActive
                                ]}
                                onPress={() => handleSelect(option)}
                            >
                                <Text
                                    variant="body"
                                    weight="medium"
                                    color={answers[currentQuestion.id] === option ? Colors.white : Colors.gray800}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
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
})
