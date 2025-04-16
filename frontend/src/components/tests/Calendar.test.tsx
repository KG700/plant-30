import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Calendar } from "../Calendar";

describe("Calendar", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2025, 3, 10, 0, 0, 0, 0)));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("opens and closes the calendar on button click", async () => {
    render(<Calendar daysAgoActive={0} setDaysAgoActive={() => {}} />);
    const calendarButton = screen.getByTestId("calendar-button");

    expect(screen.queryByLabelText("Choose Date")).not.toBeInTheDocument();

    // Open the calendar
    fireEvent.click(calendarButton);
    expect(screen.queryByLabelText("Choose Date")).toBeInTheDocument();

    // Close the calendar
    fireEvent.click(calendarButton);
    waitFor(() => {
      expect(screen.queryByLabelText("Choose Date")).not.toBeInTheDocument();
    });
  });

  it("calls setDaysAgoActive with the correct value when a date is selected", async () => {
    const mockSetDaysAgoActive = jest.fn();

    render(
      <Calendar daysAgoActive={0} setDaysAgoActive={mockSetDaysAgoActive} />,
    );

    const calendarButton = screen.getByTestId("calendar-button");

    // Open the calendar
    fireEvent.click(calendarButton);

    const eightDaysAgo = screen.queryByLabelText(
      "Choose Wednesday, April 2nd, 2025",
    );
    if (eightDaysAgo) fireEvent.click(eightDaysAgo);

    expect(mockSetDaysAgoActive).toHaveBeenCalledWith(8);
  });
});
