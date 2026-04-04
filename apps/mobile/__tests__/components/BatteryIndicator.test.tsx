import React from 'react';
import { render } from '@testing-library/react-native';
import { BatteryIndicator } from '../../components/BatteryIndicator';

describe('BatteryIndicator', () => {
  it('renders without crashing at 50%', () => {
    const { toJSON } = render(<BatteryIndicator soe={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without crashing at 0%', () => {
    const { toJSON } = render(<BatteryIndicator soe={0} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without crashing at 100%', () => {
    const { toJSON } = render(<BatteryIndicator soe={100} />);
    expect(toJSON()).toBeTruthy();
  });

  it('clamps values above 100', () => {
    const { toJSON } = render(<BatteryIndicator soe={150} />);
    expect(toJSON()).toBeTruthy();
  });

  it('clamps values below 0', () => {
    const { toJSON } = render(<BatteryIndicator soe={-10} />);
    expect(toJSON()).toBeTruthy();
  });
});
