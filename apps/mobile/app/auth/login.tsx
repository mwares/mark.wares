import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[commonStyles.screen, styles.container]}>
      <Text style={styles.title}>Solar Monitor</Text>
      <Text style={styles.subtitle}>
        {isRegister ? 'Create your account' : 'Sign in to continue'}
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.switchText}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>

      {/* Demo mode shortcut */}
      <TouchableOpacity
        style={styles.demoButton}
        onPress={() => {
          setEmail('demo@solar-monitor.app');
          setPassword('demo1234');
        }}
      >
        <Text style={styles.demoText}>Use demo account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.solar,
    fontSize: fontSize.hero,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  button: {
    backgroundColor: colors.solar,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  demoButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  demoText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textDecorationLine: 'underline',
  },
  errorBox: {
    backgroundColor: colors.alert + '22',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  errorText: {
    color: colors.alert,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
