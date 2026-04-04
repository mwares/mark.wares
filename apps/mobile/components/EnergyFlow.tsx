import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Line, Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import { wattsToKw } from '@solar-monitor/shared';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface EnergyFlowProps {
  solarW: number;
  batteryW: number;
  gridW: number;
  homeW: number;
}

interface FlowLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  power: number;
  maxFlow: number;
  active: boolean;
}

function FlowLine({ x1, y1, x2, y2, color, power, maxFlow, active }: FlowLineProps) {
  if (!active) return null;

  const strokeWidth = Math.max(1.5, (Math.abs(power) / maxFlow) * 6);

  // Animated pulse dot along the flow line
  const progress = useSharedValue(0);

  useEffect(() => {
    const speed = Math.max(1500, 3000 - (Math.abs(power) / maxFlow) * 2000);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: speed, easing: Easing.linear }),
      -1,
      false,
    );
  }, [power, maxFlow]);

  const animatedProps = useAnimatedProps(() => ({
    cx: x1 + (x2 - x1) * progress.value,
    cy: y1 + (y2 - y1) * progress.value,
  }));

  return (
    <G>
      {/* Glow line */}
      <Line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeWidth + 4}
        opacity={0.15}
        strokeLinecap="round"
      />
      {/* Main line */}
      <Line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.7}
        strokeLinecap="round"
      />
      {/* Animated pulse dot */}
      <AnimatedCircle
        r={strokeWidth + 1}
        fill={color}
        opacity={0.9}
        animatedProps={animatedProps}
      />
    </G>
  );
}

export function EnergyFlow({ solarW, batteryW, gridW, homeW }: EnergyFlowProps) {
  const maxFlow = Math.max(solarW, Math.abs(batteryW), Math.abs(gridW), homeW, 1);

  // Determine flow directions
  const solarToHome = solarW > 0;
  const batteryCharging = batteryW > 0; // positive = charging from solar
  const batteryDischarging = batteryW < 0; // negative = discharging to home
  const gridImporting = gridW > 0;
  const gridExporting = gridW < 0;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={220} viewBox="0 0 300 220">
        <Defs>
          <RadialGradient id="solarGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.solar} stopOpacity={0.6} />
            <Stop offset="100%" stopColor={colors.solar} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="homeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.home} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={colors.home} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="batteryGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.battery} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={colors.battery} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="gridGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.grid} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={colors.grid} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* ── Flow Lines (drawn first, under nodes) ── */}

        {/* Solar → Home */}
        <FlowLine
          x1={75} y1={52} x2={132} y2={95}
          color={colors.solar}
          power={solarW}
          maxFlow={maxFlow}
          active={solarToHome}
        />

        {/* Battery ↔ Home */}
        <FlowLine
          x1={batteryCharging ? 132 : 75}
          y1={batteryCharging ? 118 : 170}
          x2={batteryCharging ? 75 : 132}
          y2={batteryCharging ? 170 : 118}
          color={colors.battery}
          power={batteryW}
          maxFlow={maxFlow}
          active={batteryW !== 0}
        />

        {/* Grid ↔ Home */}
        <FlowLine
          x1={gridImporting ? 240 : 168}
          y1={110}
          x2={gridImporting ? 168 : 240}
          y2={110}
          color={colors.grid}
          power={gridW}
          maxFlow={maxFlow}
          active={gridW !== 0}
        />

        {/* ── Nodes ── */}

        {/* Solar node (top-left) */}
        <Circle cx={60} cy={40} r={28} fill="url(#solarGlow)" />
        <Circle cx={60} cy={40} r={14} fill={colors.solar} opacity={solarW > 0 ? 0.95 : 0.3} />

        {/* Home node (center) */}
        <Circle cx={150} cy={110} r={35} fill="url(#homeGlow)" />
        <Circle cx={150} cy={110} r={18} fill={colors.home} opacity={0.9} />

        {/* Battery node (bottom-left) */}
        <Circle cx={60} cy={180} r={22} fill="url(#batteryGlow)" />
        <Circle cx={60} cy={180} r={14} fill={colors.battery} opacity={0.9} />

        {/* Grid node (right) */}
        <Circle cx={255} cy={110} r={22} fill="url(#gridGlow)" />
        <Circle cx={255} cy={110} r={14} fill={colors.grid} opacity={gridW !== 0 ? 0.9 : 0.3} />
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
    top: 88,
    left: '38%',
  },
  batteryLabel: {
    bottom: 4,
    left: spacing.md,
  },
  gridLabel: {
    top: 88,
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
