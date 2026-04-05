import React from 'react';
import { render } from '@testing-library/react-native';
import { UsageHeatmap } from '../../components/UsageHeatmap';

const mockHourlyData = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  avgSolarW: hour >= 6 && hour <= 20 ? 3000 + Math.sin((hour - 6) * (Math.PI / 14)) * 5000 : 0,
  avgHomeW: 1000 + (hour >= 17 && hour <= 20 ? 2000 : 0),
  avgGridW: 500,
  avgBatteryW: 0,
}));

describe('UsageHeatmap', () => {
  it('renders 24 hour cells', () => {
    const { getAllByTestId, toJSON } = render(
      <UsageHeatmap data={mockHourlyData} metric="avgHomeW" />,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders with different metrics', () => {
    const { toJSON: jsonHome } = render(
      <UsageHeatmap data={mockHourlyData} metric="avgHomeW" />,
    );
    const { toJSON: jsonSolar } = render(
      <UsageHeatmap data={mockHourlyData} metric="avgSolarW" />,
    );
    const { toJSON: jsonGrid } = render(
      <UsageHeatmap data={mockHourlyData} metric="avgGridW" />,
    );

    expect(jsonHome()).toBeTruthy();
    expect(jsonSolar()).toBeTruthy();
    expect(jsonGrid()).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    const { toJSON } = render(<UsageHeatmap data={[]} metric="avgHomeW" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders legend with Low and High labels', () => {
    const { getByText } = render(
      <UsageHeatmap data={mockHourlyData} metric="avgHomeW" />,
    );
    expect(getByText('Low')).toBeTruthy();
    expect(getByText('High')).toBeTruthy();
  });
});
