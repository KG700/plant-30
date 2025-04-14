import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Home } from "../Home";

jest.mock("../../components/LogoutButton");
// jest.mock("../../components/HomeNavigation");
jest.mock("../../components/Day");
jest.mock("../../components/Week");

describe("Home", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2025, 3, 10)));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("displays todays date when Day is selected", () => {
    render(<Home />);

    expect(screen.queryByText("Thursday, 10 April 2025")).toBeInTheDocument();
  });

  it("displays week start and end dates when Week is selected", async () => {
    render(<Home />);

    const weekButton = screen.getByRole("button", { name: /week/i });

    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(screen.queryByText(/Friday, 4 April/)).toBeInTheDocument();
      expect(screen.queryByText(/Thursday, 10 April 2025/)).toBeInTheDocument();
    });
  });
});
