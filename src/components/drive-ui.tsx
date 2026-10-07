import { ReactNode, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Avatar, Button, Chip, Divider, Drawer, IconButton, Modal, Portal, Text as PaperText, TextInput, TextInputProps as PaperTextInputProps } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriveColors } from '@/constants/drive-theme';
import { useDriveApp } from '@/hooks/use-drive-app';

export const ScreenWidth = 680;

export function AppText({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <PaperText style={[styles.text, style]}>{children}</PaperText>;
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><AppText style={styles.brandInitial}>R</AppText></View>
      <AppText style={styles.brandName}>rota</AppText>
    </View>
  );
}

export function TopBar({ roleLabel }: { roleLabel: string }) {
  return (
    <View style={styles.topBar}>
      <Brand />
      <View style={styles.topBarActions}>
        <View style={styles.roleBadge}><AppText style={styles.roleBadgeText}>{roleLabel}</AppText></View>
        <ProfileDrawerButton />
      </View>
    </View>
  );
}

export function BackBar({ title }: { title: string }) {
  return (
    <View style={styles.backBar}>
      <View style={styles.backGroup}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/login')} style={styles.backButton}>
          <AppText style={styles.backArrow}>‹</AppText>
        </Pressable>
        <AppText style={styles.backTitle}>{title}</AppText>
      </View>
      <ProfileDrawerButton />
    </View>
  );
}

const drawerIcons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  people: { ios: 'person.2.fill', android: 'groups', web: 'groups' },
  schedule: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  lesson: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
} as const;

function ProfileDrawerButton() {
  const { role, authenticated, accountName, accountEmail, signOut } = useDriveApp();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  if (!authenticated) return null;

  const peopleLabel = role === 'teacher' ? 'Meus alunos' : role === 'admin' ? 'Pessoas' : 'Instrutores';
  const homeLabel = role === 'admin' ? 'Painel' : 'Início';
  const roleLabel = role === 'teacher' ? 'INSTRUTOR' : role === 'admin' ? 'ADMINISTRADOR' : 'ALUNO';
  const initials = accountName.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const items: { label: string; route: '/(tabs)' | '/(tabs)/teachers' | '/(tabs)/schedule' | '/lesson' | '/(tabs)/account'; icon: keyof typeof drawerIcons }[] = [
    { label: homeLabel, route: '/(tabs)', icon: 'home' },
    { label: peopleLabel, route: '/(tabs)/teachers', icon: 'people' },
    { label: 'Agenda', route: '/(tabs)/schedule', icon: 'schedule' },
    { label: 'Aula atual', route: '/lesson', icon: 'lesson' },
    { label: role === 'admin' ? 'Gestão' : 'Meu perfil', route: '/(tabs)/account', icon: 'profile' },
  ];

  function navigate(route: (typeof items)[number]['route']) {
    setVisible(false);
    router.navigate(route);
  }

  return (
    <>
      <IconButton
        accessibilityLabel="Abrir menu de navegação"
        icon={({ color, size }) => <SymbolView name={drawerIcons.profile} tintColor={color} size={size} />}
        mode="contained-tonal"
        containerColor={DriveColors.lime}
        iconColor={DriveColors.ink}
        size={21}
        onPress={() => setVisible(true)}
      />
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          overlayAccessibilityLabel="Fechar menu de navegação"
          style={styles.drawerModal}
          contentContainerStyle={styles.drawerPanel}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.drawerSafeArea}>
            <View style={styles.drawerIdentity}>
              <Avatar.Text size={48} label={initials} style={styles.drawerAvatar} color={DriveColors.green} />
              <View style={styles.drawerAccount}>
                <PaperText variant="titleMedium" numberOfLines={1}>{accountName}</PaperText>
                <PaperText variant="bodySmall" numberOfLines={1} style={styles.drawerEmail}>{accountEmail}</PaperText>
                <PaperText variant="labelSmall" style={styles.drawerRole}>{roleLabel}</PaperText>
              </View>
            </View>
            <Divider style={styles.drawerDivider} />
            <Drawer.Section title="Navegação">
              {items.map((item) => {
                const leaf = item.route.split('/').pop() ?? '';
                const active = item.route === '/(tabs)' ? pathname === '/' || pathname === '/(tabs)' : pathname.endsWith(`/${leaf}`);
                return (
                  <Drawer.Item
                    key={item.route}
                    label={item.label}
                    active={active}
                    icon={({ color, size }) => <SymbolView name={drawerIcons[item.icon]} tintColor={color} size={size} />}
                    onPress={() => navigate(item.route)}
                  />
                );
              })}
            </Drawer.Section>
            <View style={styles.drawerFooter}>
              <Divider style={styles.drawerDivider} />
              <Drawer.Item
                label="Sair da conta"
                icon={({ color, size }) => <SymbolView name={drawerIcons.signOut} tintColor={color} size={size} />}
                onPress={() => { setVisible(false); signOut(); router.replace('/login'); }}
              />
              <PaperText variant="labelSmall" style={styles.drawerBrand}>ROTA · AULAS DE DIREÇÃO</PaperText>
            </View>
          </SafeAreaView>
        </Modal>
      </Portal>
    </>
  );
}

export function FormField({ label, ...props }: PaperTextInputProps & { label: string }) {
  return (
    <View style={styles.formField}>
      <TextInput
        {...props}
        label={label}
        mode="outlined"
        outlineColor={DriveColors.line}
        activeOutlineColor={DriveColors.green}
        textColor={DriveColors.ink}
        placeholderTextColor={DriveColors.muted}
        style={[styles.formInput, props.style]}
      />
    </View>
  );
}

export function SectionHeading({ title, aside }: { title: string; aside?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {!!aside && <AppText style={styles.sectionAside}>{aside}</AppText>}
    </View>
  );
}

export function ActionButton({ label, onPress, variant = 'primary', compact = false, disabled = false }: { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'light'; compact?: boolean; disabled?: boolean }) {
  const mode = variant === 'primary' ? 'contained' : variant === 'secondary' ? 'contained-tonal' : 'outlined';
  const buttonColor = variant === 'primary' ? DriveColors.green : variant === 'secondary' ? DriveColors.surfaceMuted : DriveColors.white;
  const textColor = variant === 'primary' ? DriveColors.white : variant === 'light' ? DriveColors.green : DriveColors.ink;

  return (
    <Button
      mode={mode}
      buttonColor={buttonColor}
      textColor={textColor}
      compact={compact}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, compact && styles.buttonCompact]}
      contentStyle={compact ? styles.buttonContentCompact : styles.buttonContent}
      labelStyle={styles.buttonLabel}
      uppercase={false}>
      {label}
    </Button>
  );
}

export function StatusTag({ label, dark = false }: { label: string; dark?: boolean }) {
  return <Chip compact mode="flat" style={[styles.statusTag, dark && styles.statusTagDark]} textStyle={[styles.statusText, dark && styles.statusTextDark]}>{label}</Chip>;
}

const styles = StyleSheet.create({
  text: { color: DriveColors.ink },
  safeArea: { flex: 1, backgroundColor: DriveColors.background },
  scrollContent: { flexGrow: 1, paddingBottom: 26 },
  content: { width: '100%', maxWidth: ScreenWidth, alignSelf: 'center', paddingHorizontal: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandMark: { width: 27, height: 27, borderRadius: 8, backgroundColor: DriveColors.lime, alignItems: 'center', justifyContent: 'center' },
  brandInitial: { color: DriveColors.ink, fontSize: 17, fontWeight: '800' },
  brandName: { color: DriveColors.ink, fontSize: 21, fontWeight: '800' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 42, paddingTop: 5 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: DriveColors.ink, fontSize: 29, lineHeight: 32 },
  backTitle: { color: DriveColors.ink, fontSize: 15, fontWeight: '600' },
  drawerModal: { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start' },
  drawerPanel: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '84%', maxWidth: 360, backgroundColor: DriveColors.white, paddingHorizontal: 14, paddingTop: 18, paddingBottom: 10, borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  drawerSafeArea: { flex: 1 },
  drawerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 14 },
  drawerAvatar: { backgroundColor: DriveColors.lime },
  drawerAccount: { flex: 1, gap: 2 },
  drawerEmail: { color: DriveColors.muted },
  drawerRole: { color: DriveColors.green, marginTop: 3 },
  drawerDivider: { backgroundColor: DriveColors.line },
  drawerFooter: { marginTop: 'auto' },
  drawerBrand: { color: DriveColors.muted, textAlign: 'center', paddingVertical: 12 },
  formField: { gap: 7 },
  formInput: { backgroundColor: DriveColors.white },
  roleBadge: { backgroundColor: DriveColors.surfaceMuted, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14 },
  roleBadgeText: { color: DriveColors.muted, fontSize: 11, fontWeight: '600' },
  sectionHeading: { minHeight: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: DriveColors.ink, fontSize: 16, fontWeight: '700' },
  sectionAside: { color: DriveColors.green, fontSize: 12, fontWeight: '600' },
  button: { borderRadius: 8 },
  buttonContent: { minHeight: 44 },
  buttonCompact: { alignSelf: 'flex-start', borderRadius: 7 },
  buttonContentCompact: { minHeight: 34 },
  buttonLabel: { fontSize: 13, fontWeight: '700' },
  statusTag: { alignSelf: 'flex-start', backgroundColor: '#E8EFE8', borderRadius: 7, marginVertical: 0 },
  statusTagDark: { backgroundColor: '#3D4B42' },
  statusText: { color: DriveColors.green, fontSize: 9, fontWeight: '700' },
  statusTextDark: { color: DriveColors.white },
});