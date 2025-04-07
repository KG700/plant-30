import { Authenticate } from "./Authenticate";
import { waitFor, render } from "@testing-library/react";
import { ok } from "node:assert";
import { MemoryRouter, useNavigate } from 'react-router';

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
}));

describe('Authenticate', () => {
    let mockNavigate: jest.Mock;

    beforeEach(() => {
        mockNavigate = jest.fn();
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve("http://google_login_url"),
          })
        );
      })

    it('calls authorise to authenticate user', async () => {
        render(
            <MemoryRouter initialEntries={['/?code=test_code']}>
                <Authenticate />
            </MemoryRouter>
        );

        waitFor(() => {
            expect(global.fetch).toBeCalledWith(`${process.env.REACT_APP_BASE_URL}/authorise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
                },
                body: JSON.stringify({ code: 'test_code' })
            });
        })
        await waitFor(() => {
            expect(mockNavigate).toBeCalledTimes(1);
            expect(mockNavigate).toBeCalledWith('/');
        })
    })
})
