import { fireEvent, render, screen, waitFor} from '@testing-library/react';
import { location } from './__mocks__/window';
import { Login } from './Login';

describe('Login', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve("http://google_login_url"),
          })
        );
      })

    afterEach(() => {
        jest.restoreAllMocks();
      });

    it('calls login to retrieve login url and redirects', async () => {

      render(<Login />);

        const loginButton = screen.getByRole('button', { name: /login/i });
        fireEvent.click(loginButton);

        expect(global.fetch).toBeCalledWith(`${process.env.REACT_APP_BASE_URL}/login`, { "headers": {"Access-Control-Allow-Origin": "http://localhost:3000"} });
        waitFor(() => {
            expect(location.href).toBe('http://google_login_url');
        })
    });
})
