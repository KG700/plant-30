import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {

  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          { id: 1, name: 'rice' },
          { id: 2, name: 'onion' },
        ]),
      })
    );
  })

  it('renders Today view', async () => {
    render(<App />);

    await waitFor(() => {
      const todayView = screen.getByTestId('today-view');
      expect(todayView).toBeInTheDocument();
    });
  });

});
