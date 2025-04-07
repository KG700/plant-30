import { fireEvent, render, screen, waitFor} from '@testing-library/react';
import { Login } from './Login';

describe('Login', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve("http://google_login_url"),
          })
        );

        delete (window as any).location;
        (window as any).location = {
          href: '', // Initial value
          assign: jest.fn(), // You can mock assign if needed
        };
      })

    afterEach(() => {
        jest.restoreAllMocks();
      });

    it('calls login to retrieve login url and redirects', async () => {

      render(<Login />);

        const loginButton = screen.getByRole('button', { name: /login/i });
        fireEvent.click(loginButton);

        expect(global.fetch).toBeCalledWith(`${process.env.REACT_APP_BASE_URL}/login`, { "headers": {"Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? ''} });
        await waitFor(() => {
            expect(window.location.href).toBe('http://google_login_url');
        })
    });
})
