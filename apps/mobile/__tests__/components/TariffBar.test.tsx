import React from 'react';
import { render } from '@testing-library/react-native';
import { TariffBar } from '../../components/TariffBar';

const mockTariff = {
  currency: 'AUD',
  periods: [
    { name: 'Off-Peak', startHour: 22, endHour: 7, ratePerKwh: 0.15 },
    { name: 'Shoulder', startHour: 7, endHour: 14, ratePerKwh: 0.25 },
    { name: 'Peak', startHour: 14, endHour: 20, ratePerKwh: 0.45 },
    { name: 'Shoulder', startHour: 20, endHour: 22, ratePerKwh: 0.25 },
  ],
  feedInTariff: 0.05,
};

describe('TariffBar', () => {
  it('renders all tariff period labels', () => {
    const { getByText } = render(
      <TariffBar
        periods={mockTariff.periods}
        feedInTariff={mockTariff.feedInTariff}
        currency={mockTariff.currency}
      />,
    );

    expect(getByText('Off-Peak')).toBeTruthy();
    expect(getByText('Shoulder')).toBeTruthy();
    expect(getByText('Peak')).toBeTruthy();
  });

  it('displays tariff rates', () => {
    const { getByText } = render(
      <TariffBar
        periods={mockTariff.periods}
        feedInTariff={mockTariff.feedInTariff}
        currency={mockTariff.currency}
      />,
    );

    expect(getByText('$0.15/kWh')).toBeTruthy();
    expect(getByText('$0.45/kWh')).toBeTruthy();
  });

  it('displays feed-in tariff', () => {
    const { getByText } = render(
      <TariffBar
        periods={mockTariff.periods}
        feedInTariff={mockTariff.feedInTariff}
        currency={mockTariff.currency}
      />,
    );

    expect(getByText('Feed-in tariff')).toBeTruthy();
    expect(getByText('$0.05/kWh')).toBeTruthy();
  });

  it('renders correctly with component tree', () => {
    const { toJSON } = render(
      <TariffBar
        periods={mockTariff.periods}
        feedInTariff={mockTariff.feedInTariff}
        currency={mockTariff.currency}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
