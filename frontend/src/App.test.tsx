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

  it('renders Login view', async () => {
    render(<App />);

    await waitFor(() => {
      const loginView = screen.getByRole('button', { name: /login/i });
      expect(loginView).toBeInTheDocument();
    });
  });

});
