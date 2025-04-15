import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Home } from "../Home";

jest.mock("../../components/LogoutButton");
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

  it("displays yesterdays date when Yesterday is selected", async () => {
    render(<Home />);

    const yesterdayButton = screen.getByRole("button", { name: /Yesterday/i });
    fireEvent.click(yesterdayButton)

    await waitFor(() => {
      expect(screen.queryByText("Wednesday, 9 April 2025")).toBeInTheDocument();
    })
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

  it("displays week start and end dates from previous day when Yesterday and Week is selected", async () => {
    render(<Home />);

    const yesterdayButton = screen.getByRole("button", { name: /Yesterday/i });
    const weekButton = screen.getByRole("button", { name: /week/i });

    fireEvent.click(yesterdayButton);
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(screen.queryByText(/Thursday, 3 April/)).toBeInTheDocument();
      expect(screen.queryByText(/Wednesday, 9 April 2025/)).toBeInTheDocument();
    });
  });
});
