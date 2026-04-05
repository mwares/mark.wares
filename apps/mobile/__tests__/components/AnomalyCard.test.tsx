import React from 'react';
import { render } from '@testing-library/react-native';
import { AnomalyCard } from '../../components/AnomalyCard';

describe('AnomalyCard', () => {
  const highAnomaly = {
    date: '2026-04-03',
    metric: 'home_kwh',
    value: 35.2,
    expectedRange: { min: 15.0, max: 25.0 },
    description: 'Home consumption was unusually high at 35.2 kWh (expected 15.0-25.0 kWh)',
  };

  const lowAnomaly = {
    date: '2026-04-02',
    metric: 'solar_kwh',
    value: 5.1,
    expectedRange: { min: 18.0, max: 30.0 },
    description: 'Solar production was unusually low at 5.1 kWh (expected 18.0-30.0 kWh)',
  };

  it('renders HIGH badge for values above range', () => {
    const { getByText } = render(<AnomalyCard anomaly={highAnomaly} />);
    expect(getByText('HIGH')).toBeTruthy();
  });

  it('renders LOW badge for values below range', () => {
    const { getByText } = render(<AnomalyCard anomaly={lowAnomaly} />);
    expect(getByText('LOW')).toBeTruthy();
  });

  it('displays description text', () => {
    const { getByText } = render(<AnomalyCard anomaly={highAnomaly} />);
    expect(getByText(highAnomaly.description)).toBeTruthy();
  });

  it('displays expected range', () => {
    const { getByText } = render(<AnomalyCard anomaly={highAnomaly} />);
    expect(getByText('Expected: 15.0–25.0 kWh')).toBeTruthy();
    expect(getByText('Actual: 35.2 kWh')).toBeTruthy();
  });

  it('formats date correctly', () => {
    const { getByText } = render(<AnomalyCard anomaly={highAnomaly} />);
    // Should display in en-AU format
    expect(getByText(/Apr/)).toBeTruthy();
  });
});
