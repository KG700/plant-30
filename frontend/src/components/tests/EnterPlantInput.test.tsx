import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router";
import { EnterPlantInput } from "../EnterPlantInput";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

describe("EnterPlantInput", () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { _id: 1, name: "apple" },
            { _id: 2, name: "pear" },
          ]),
      }),
    );
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => "mocked-token"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it("submits plant when entered", async () => {
    const mockOnPlantAdded = jest.fn();

    render(
      <EnterPlantInput pageDate="today" onPlantAdded={mockOnPlantAdded} />,
    );

    const inputField: HTMLInputElement = screen.getByLabelText("enter-plant");
    fireEvent.click(inputField);

    waitFor(() => {
      const appleListItem = screen.getByText("apple");
      fireEvent.click(appleListItem);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_BASE_URL}/user/add-plant/1?when=today`,
        {
          headers: {
            "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
            Authorization: "Bearer mocked-token",
          },
          method: "POST",
        },
      );
    });
    expect(screen.queryByTestId("plant-dropdown")).not.toBeInTheDocument();
    expect(inputField.value).toBe("");
    expect(mockOnPlantAdded).toHaveBeenCalled();
    expect(screen.getByText("Added apple to your plants")).toBeInTheDocument();

    fireEvent.click(document.body);
    waitFor(() => {
      expect(
        screen.queryByText("Added apple to your plants"),
      ).not.toBeInTheDocument();
    });
  });

  it("displays error message if plant submission fails", async () => {
    (global.fetch as jest.Mock)
      .mockReturnValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { _id: 1, name: "apple" },
            { _id: 2, name: "pear" },
          ]),
      })
      .mockRejectedValueOnce(
        "Failed to add apple to your plants. Please try again.",
      );

    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);

    const inputField: HTMLInputElement = screen.getByLabelText("enter-plant");
    fireEvent.click(inputField);

    waitFor(() => {
      const appleListItem = screen.getByText("apple");
      fireEvent.click(appleListItem);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_BASE_URL}/user/add-plant/1?when=today`,
        {
          headers: {
            "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
            Authorization: "Bearer mocked-token",
          },
          method: "POST",
        },
      );
      expect(
        screen.getByText(
          "Failed to add apple to your plants. Please try again.",
        ),
      ).toBeVisible();
    });
  });

  it("displays error message if user adds the same plant twice", async () => {
    (global.fetch as jest.Mock)
      .mockReturnValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { _id: 1, name: "apple" },
            { _id: 2, name: "pear" },
          ]),
      })
      .mockReturnValueOnce({ ok: true })
      .mockReturnValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            detail: "Plant already exists in user's collection",
          }),
      });

    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);

    const inputField: HTMLInputElement = screen.getByLabelText("enter-plant");
    fireEvent.click(inputField);

    await waitFor(() => {
      const appleListItem = screen.getByText("apple");
      fireEvent.click(appleListItem);
    });
    fireEvent.click(inputField);
    waitFor(() => {
      const appleListItem = screen.getByText("apple");
      fireEvent.click(appleListItem);
    });

    await waitFor(() => {
      expect(
        screen.getByText("You already have apple in your plants"),
      ).toBeVisible();
    });
  });

  it("updates enteredPlant state when input changes", () => {
    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);
    const inputField: HTMLInputElement = screen.getByLabelText("enter-plant");
    fireEvent.change(inputField, { target: { value: "app" } });
    expect(inputField.value).toBe("app");
  });

  it("opens the dropdown when input is clicked", async () => {
    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);
    const inputField = screen.getByLabelText("enter-plant");
    fireEvent.click(inputField);
    await waitFor(() => {
      expect(screen.getByTestId("plant-dropdown")).toBeVisible();
    });
  });

  it("closes the dropdown when clicking outside", async () => {
    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);
    const inputField = screen.getByLabelText("enter-plant");
    fireEvent.click(inputField);
    await waitFor(() => {
      expect(screen.getByTestId("plant-dropdown")).toBeVisible();
    });
    fireEvent.click(document.body); // Simulate click outside
    expect(screen.queryByTestId("plant-dropdown")).not.toBeInTheDocument();
  });

  it("fetches plants when input changes", async () => {
    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);

    const inputField = screen.getByLabelText("enter-plant");
    fireEvent.change(inputField, { target: { value: "ap" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_BASE_URL}/plants/search?q=ap`,
        expect.any(Object),
      );
    });
  });

  it("displays error message if fetching plants fails", async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.reject("Fetch Error"));

    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);

    const inputField = screen.getByLabelText("enter-plant");
    fireEvent.click(inputField);

    await waitFor(() => {
      expect(screen.getByText("Error fetching plants")).toBeVisible();
    });
  });

  it("submits a plant on pressing Enter or Space on a dropdown item", async () => {
    render(<EnterPlantInput pageDate="today" onPlantAdded={jest.fn} />);

    // Open the dropdown
    const inputField = screen.getByLabelText("enter-plant");
    fireEvent.click(inputField);

    // Wait for the dropdown to appear
    await waitFor(() => {
      screen.getByText("apple");
    });

    const appleListItem = screen.getByText("apple");

    // Focus the list item (important for keyboard events)
    appleListItem.focus();

    // Simulate pressing Enter
    fireEvent.keyDown(appleListItem, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_BASE_URL}/user/add-plant/1?when=today`,
        expect.any(Object),
      );
    });
  });
});
