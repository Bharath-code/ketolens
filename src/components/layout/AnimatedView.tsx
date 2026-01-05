/**
 * AnimatedView Component
 * A wrapper for smooth, staggered entry animations using Moti
 */

import React from 'react'
import { MotiView } from 'moti'

type AnimationType = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn'

interface AnimatedViewProps {
    children: React.ReactNode
    animation?: AnimationType
    delay?: number
    duration?: number
    style?: any
}

export function AnimatedView({
    children,
    animation = 'slideUp',
    delay = 0,
    duration = 500,
    style,
}: AnimatedViewProps) {
    const getInitialState = () => {
        switch (animation) {
            case 'fadeIn': return { opacity: 0 }
            case 'slideUp': return { opacity: 0, translateY: 20 }
            case 'slideDown': return { opacity: 0, translateY: -20 }
            case 'slideLeft': return { opacity: 0, translateX: 20 }
            case 'slideRight': return { opacity: 0, translateX: -20 }
            case 'scaleIn': return { opacity: 0, scale: 0.9 }
            default: return { opacity: 0 }
        }
    }

    const getAnimateState = () => {
        switch (animation) {
            case 'fadeIn': return { opacity: 1 }
            case 'slideUp': return { opacity: 1, translateY: 0 }
            case 'slideDown': return { opacity: 1, translateY: 0 }
            case 'slideLeft': return { opacity: 1, translateX: 0 }
            case 'slideRight': return { opacity: 1, translateX: 0 }
            case 'scaleIn': return { opacity: 1, scale: 1 }
            default: return { opacity: 1 }
        }
    }

    return (
        <MotiView
            from={getInitialState()}
            animate={getAnimateState()}
            transition={{
                type: 'spring',
                damping: 25,
                stiffness: 250,
                delay,
            }}
            style={style}
        >
            {children}
        </MotiView>
    )
}
