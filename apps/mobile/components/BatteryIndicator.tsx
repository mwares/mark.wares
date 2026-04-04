import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, borderRadius } from '@/theme';

interface BatteryIndicatorProps {
  soe: number;
}

export function BatteryIndicator({ soe }: BatteryIndicatorProps) {
  const clampedSoe = Math.max(0, Math.min(100, soe));
  const fillColor = clampedSoe > 50 ? colors.battery : clampedSoe > 20 ? colors.solar : colors.alert;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={30} viewBox="0 0 280 30">
        <Defs>
          <LinearGradient id="batteryFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={fillColor} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={fillColor} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Battery outline */}
        <Rect x={0} y={2} width={260} height={26} rx={6} fill="none" stroke={colors.borderLight} strokeWidth={1.5} />
        {/* Battery tip */}
        <Rect x={262} y={9} width={8} height={12} rx={2} fill={colors.borderLight} />

        {/* Fill */}
        <Rect
          x={3}
          y={5}
          width={Math.max(0, (254 * clampedSoe) / 100)}
          height={20}
          rx={4}
          fill="url(#batteryFill)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
});
