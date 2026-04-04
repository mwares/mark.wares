import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PowerGauge } from '../../components/PowerGauge';

describe('PowerGauge', () => {
  it('renders label and value', () => {
    render(<PowerGauge label="Solar" value={4500} unit="W" color="#FFD93D" />);

    expect(screen.getByText('Solar')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('kW')).toBeTruthy();
  });

  it('shows watts for values under 1000', () => {
    render(<PowerGauge label="Home" value={750} unit="W" color="#FFFFFF" />);

    expect(screen.getByText('750')).toBeTruthy();
    expect(screen.getByText('W')).toBeTruthy();
  });

  it('shows exporting for negative grid values', () => {
    render(<PowerGauge label="Grid" value={-2000} unit="W" color="#448AFF" />);

    expect(screen.getByText('exporting')).toBeTruthy();
  });

  it('shows importing for positive grid values', () => {
    render(<PowerGauge label="Grid" value={1500} unit="W" color="#448AFF" />);

    expect(screen.getByText('importing')).toBeTruthy();
  });
});
