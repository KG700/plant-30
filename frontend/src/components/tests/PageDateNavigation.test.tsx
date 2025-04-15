import { render, screen } from "@testing-library/react";
import { PageDateNavigation } from "../PageDateNavigation";

describe("PageDateNavigation", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2025, 3, 10, 0, 0, 0, 0)));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders 7 date buttons", () => {
    render(<PageDateNavigation daysAgoActive={0} setDaysAgoActive={jest.fn} />);

    const todayButton = screen.getByRole("button", { name: /Today/i });
    const yesterdayButton = screen.getByRole("button", { name: /Yesterday/i });
    const tuesdayButton = screen.getByRole("button", { name: /Tue/i });
    const mondayButton = screen.getByRole("button", { name: /Mon/i });
    const sundayButton = screen.getByRole("button", { name: /Sun/i });
    const saturdayButton = screen.getByRole("button", { name: /Sat/i });
    const fridayButton = screen.getByRole("button", { name: /Fri/i });

    expect(todayButton).toBeInTheDocument();
    expect(yesterdayButton).toBeInTheDocument();
    expect(tuesdayButton).toBeInTheDocument();
    expect(mondayButton).toBeInTheDocument();
    expect(sundayButton).toBeInTheDocument();
    expect(saturdayButton).toBeInTheDocument();
    expect(fridayButton).toBeInTheDocument();
  });
});
