import { fireEvent, render, screen } from "@testing-library/react"
import { useNavigate } from "react-router";
import { ErrorPage } from "../ErrorPage"

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
  }));

describe('ErrorPage', () => {
    let mockNavigate: jest.Mock;

    beforeEach(() => {
        mockNavigate = jest.fn();
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    })

    it('renders button that directs to login page', () => {
        render(<ErrorPage />)

        const redirectButton = screen.getByRole('button');
        fireEvent.click(redirectButton);

        expect(mockNavigate).toBeCalledWith('/login')
    })
})
