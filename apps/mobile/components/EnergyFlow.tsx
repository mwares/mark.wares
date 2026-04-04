import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import { wattsToKw } from '@solar-monitor/shared';

interface EnergyFlowProps {
  solarW: number;
  batteryW: number;
  gridW: number;
  homeW: number;
}

export function EnergyFlow({ solarW, batteryW, gridW, homeW }: EnergyFlowProps) {
  const maxFlow = Math.max(solarW, Math.abs(batteryW), Math.abs(gridW), homeW, 1);

  return (
    <View style={styles.container}>
      <Svg width="100%" height={200} viewBox="0 0 300 200">
        <Defs>
          <RadialGradient id="solarGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.solar} stopOpacity={0.6} />
            <Stop offset="100%" stopColor={colors.solar} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="homeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.home} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={colors.home} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Solar node (top-left) */}
        <Circle cx={60} cy={40} r={25} fill="url(#solarGlow)" />
        <Circle cx={60} cy={40} r={12} fill={colors.solar} opacity={0.9} />

        {/* Home node (center) */}
        <Circle cx={150} cy={100} r={30} fill="url(#homeGlow)" />
        <Circle cx={150} cy={100} r={15} fill={colors.home} opacity={0.9} />

        {/* Battery node (bottom-left) */}
        <Circle cx={60} cy={160} r={12} fill={colors.battery} opacity={0.9} />

        {/* Grid node (right) */}
        <Circle cx={260} cy={100} r={12} fill={colors.grid} opacity={0.9} />

        {/* Flow lines */}
        {/* Solar → Home */}
        {solarW > 0 && (
          <Line
            x1={72} y1={48} x2={135} y2={90}
            stroke={colors.solar}
            strokeWidth={Math.max(1, (solarW / maxFlow) * 5)}
            opacity={0.8}
          />
        )}

        {/* Battery ↔ Home */}
        {batteryW !== 0 && (
          <Line
            x1={72} y1={155} x2={135} y2={110}
            stroke={colors.battery}
            strokeWidth={Math.max(1, (Math.abs(batteryW) / maxFlow) * 5)}
            opacity={0.8}
          />
        )}

        {/* Grid ↔ Home */}
        {gridW !== 0 && (
          <Line
            x1={248} y1={100} x2={165} y2={100}
            stroke={colors.grid}
            strokeWidth={Math.max(1, (Math.abs(gridW) / maxFlow) * 5)}
            opacity={0.8}
          />
        )}
      </Svg>

      {/* Labels overlay */}
      <View style={styles.labelContainer}>
        <View style={[styles.label, styles.solarLabel]}>
          <Text style={[styles.labelTitle, { color: colors.solar }]}>Solar</Text>
          <Text style={[styles.labelValue, { color: colors.solar }]}>
            {wattsToKw(solarW).toFixed(1)} kW
          </Text>
        </View>

        <View style={[styles.label, styles.homeLabel]}>
          <Text style={[styles.labelTitle, { color: colors.home }]}>Home</Text>
          <Text style={[styles.labelValue, { color: colors.home }]}>
            {wattsToKw(homeW).toFixed(1)} kW
          </Text>
        </View>

        <View style={[styles.label, styles.batteryLabel]}>
          <Text style={[styles.labelTitle, { color: colors.battery }]}>Battery</Text>
          <Text style={[styles.labelValue, { color: colors.battery }]}>
            {batteryW > 0 ? '+' : ''}{wattsToKw(batteryW).toFixed(1)} kW
          </Text>
        </View>

        <View style={[styles.label, styles.gridLabel]}>
          <Text style={[styles.labelTitle, { color: colors.grid }]}>Grid</Text>
          <Text style={[styles.labelValue, { color: colors.grid }]}>
            {gridW > 0 ? '+' : ''}{wattsToKw(gridW).toFixed(1)} kW
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
  },
  solarLabel: {
    top: 4,
    left: spacing.md,
  },
  homeLabel: {
    top: 80,
    left: '38%',
  },
  batteryLabel: {
    bottom: 4,
    left: spacing.md,
  },
  gridLabel: {
    top: 80,
    right: spacing.md,
  },
  labelTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
