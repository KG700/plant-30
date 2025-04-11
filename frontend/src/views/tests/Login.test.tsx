import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Login } from "../Login";
import { useNavigate } from "react-router";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

describe("Login", () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve("http://google_login_url"),
      }),
    );

    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete (window as any).location;
    (window as any).location = {
      href: "",
      assign: jest.fn(),
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls login to retrieve login url and redirects", async () => {
    render(<Login />);

    const loginButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(loginButton);

    expect(global.fetch).toBeCalledWith(
      `${process.env.REACT_APP_BASE_URL}/login`,
      {
        headers: {
          "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
        },
      },
    );
    await waitFor(() => {
      expect(window.location.href).toBe("http://google_login_url");
    });
  });

  it("redirect to error page if login fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce("Error");

    render(<Login />);

    const loginButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(loginButton);

    expect(global.fetch).toBeCalledWith(
      `${process.env.REACT_APP_BASE_URL}/login`,
      {
        headers: {
          "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
        },
      },
    );
    waitFor(() => {
      expect(mockNavigate).toBeCalledWith("/error");
    });
  });
});
