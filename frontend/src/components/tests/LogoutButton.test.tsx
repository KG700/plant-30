import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router";
import { LogoutButton } from "../LogoutButton";

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

describe('LogoutButton', () => {
  let mockNavigate: jest.Mock;
  let mockRemoveItem: jest.Mock = jest.fn();

  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(),
      })
    );


    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mocked-token'),
        setItem: jest.fn(),
        removeItem: mockRemoveItem,
        clear: jest.fn(),
      },
      writable: true,
    });
  })

  it('logs out', async () => {
    render(<LogoutButton />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(global.fetch).toBeCalledWith(`${process.env.REACT_APP_BASE_URL}/user/logout`, { "headers": {"Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? '', 'Authorization': 'Bearer mocked-token'}, method: 'DELETE', });
    expect(mockRemoveItem).toBeCalled();
    expect(mockNavigate).toBeCalledWith('/login')
  })
})
