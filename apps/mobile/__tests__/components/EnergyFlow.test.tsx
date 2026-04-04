import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EnergyFlow } from '../../components/EnergyFlow';

describe('EnergyFlow', () => {
  it('renders all energy labels', () => {
    render(<EnergyFlow solarW={5000} batteryW={1000} gridW={-500} homeW={3500} />);

    expect(screen.getByText('Solar')).toBeTruthy();
    expect(screen.getByText('Battery')).toBeTruthy();
    expect(screen.getByText('Grid')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('displays kW values', () => {
    render(<EnergyFlow solarW={5000} batteryW={1000} gridW={-500} homeW={3500} />);

    expect(screen.getByText('5.0 kW')).toBeTruthy();
    expect(screen.getByText('3.5 kW')).toBeTruthy();
  });

  it('renders with zero values', () => {
    const { toJSON } = render(<EnergyFlow solarW={0} batteryW={0} gridW={0} homeW={0} />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows positive/negative signs for battery and grid', () => {
    render(<EnergyFlow solarW={5000} batteryW={2000} gridW={-1500} homeW={3000} />);

    expect(screen.getByText('+2.0 kW')).toBeTruthy();
    expect(screen.getByText('-1.5 kW')).toBeTruthy();
  });
});
