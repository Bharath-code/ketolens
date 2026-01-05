import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from '../atoms/Text'
import { Colors, Spacing, Shadows, BorderRadius } from '../../constants/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MotiView } from 'moti'
import { haptics } from '../../services/hapticsService'
import { Home, Camera, User } from 'lucide-react-native'

interface TabBarProps {
    activeTab: 'home' | 'scan' | 'profile'
    onTabChange: (tab: 'home' | 'scan' | 'profile') => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
    const insets = useSafeAreaInsets()

    return (
        <View style={[styles.tabBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <TabItem
                Icon={Home}
                label="Home"
                active={activeTab === 'home'}
                onPress={() => onTabChange('home')}
            />
            <TabItem
                Icon={Camera}
                label="Scan"
                active={activeTab === 'scan'}
                onPress={() => onTabChange('scan')}
            />
            <TabItem
                Icon={User}
                label="Profile"
                active={activeTab === 'profile'}
                onPress={() => onTabChange('profile')}
            />
        </View>
    )
}

function TabItem({
    Icon,
    label,
    active,
    onPress
}: {
    Icon: any;
    label: string;
    active: boolean;
    onPress: () => void
}) {
    return (
        <Pressable
            onPress={() => {
                haptics.light()
                onPress()
            }}
            style={styles.tabItem}
        >
            <MotiView
                animate={{
                    scale: active ? 1.1 : 1,
                    translateY: active ? -4 : 0,
                }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                style={styles.iconContainer}
            >
                <Icon
                    size={24}
                    strokeWidth={active ? 2.5 : 2}
                    color={active ? Colors.ketoSafe : Colors.gray400}
                />
                {active && (
                    <MotiView
                        from={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                        style={styles.indicator}
                    />
                )}
            </MotiView>
            <Text
                variant="caption"
                weight={active ? 'bold' : 'medium'}
                color={active ? Colors.ketoSafe : Colors.gray500}
                style={{ fontSize: 10, marginTop: 2 }}
            >
                {label}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.gray100,
        ...Shadows.lg,
    },
    tabItem: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        minWidth: 80,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 32,
    },
    indicator: {
        position: 'absolute',
        bottom: -6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.ketoSafe,
    }
})
