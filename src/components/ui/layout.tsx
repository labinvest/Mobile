import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, elevation, gutter, space } from '@/theme/tokens';

import { IconButton } from './button';
import { Text } from './text';

/**
 * Tela padrão: área segura no topo, rolagem, puxar para atualizar e, opcionalmente, uma barra fixa
 * no rodapé (ex.: botão de confirmar) que sobe junto com o teclado.
 */
export function Screen({ children, header, footer, onRefresh, refreshing = false, scroll = true }: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {header}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} /> : undefined}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Cabeçalho de telas internas (pilha): voltar, título e ação opcional à direita. */
export function Header({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <IconButton
        icon="arrow-left"
        label="Voltar"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      />
      <Text variant="headline" numberOfLines={1} style={styles.headerTitle} accessibilityRole="header">{title}</Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/** Barra fixa no rodapé para a ação principal da tela. */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: gutter, paddingBottom: space.xxxl, flexGrow: 1 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xs },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 48, alignItems: 'flex-end' },
  bottomBar: { paddingHorizontal: gutter, paddingTop: space.md, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong, ...elevation.raised },
});
