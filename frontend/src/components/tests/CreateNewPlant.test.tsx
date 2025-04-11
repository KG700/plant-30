import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useNavigate } from 'react-router';
import { CreateNewPlant } from "../CreateNewPlant";
import { PlantCategories } from "../../types";

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

describe('CreateNewPlant', () => {
    let mockNavigate: jest.Mock;
    const mockOnAdd = jest.fn();

    beforeEach(() => {
      mockNavigate = jest.fn();
      (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    '_id': 'id-for-beetroot-1234',
                    name: 'beetroot',
                    category: PlantCategories.vegetable
                }),
            })
        )
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: jest.fn(() => 'mocked-token'),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
          },
          writable: true,
        });
    })

    it('renders the create new plant input and dropdown', () => {
        render(<CreateNewPlant enteredPlant="bee" onAdd={mockOnAdd}/>)

        const inputField: HTMLInputElement = screen.getByLabelText("enter-new-plant");
        const selectField: HTMLSelectElement = screen.getByTestId('category-dropdown');

        expect(inputField).toBeInTheDocument();
        expect(inputField.value).toBe("bee");
        expect(selectField).toBeInTheDocument();
        expect(selectField.value).toBe('Select plant category:')
    });

    it('updates plant name on change', () => {
        render(<CreateNewPlant enteredPlant="bee" onAdd={mockOnAdd}/>)

        const inputField: HTMLInputElement = screen.getByLabelText("enter-new-plant");
        fireEvent.change(inputField, { target: { value: 'beetroot' }});

        expect(inputField.value).toBe('beetroot');
    });

    it('updates selected category on select change', () => {
        render(<CreateNewPlant enteredPlant="bee" onAdd={mockOnAdd}/>)

        const selectField: HTMLSelectElement = screen.getByTestId('category-dropdown');
        fireEvent.change(selectField, { target: { value: PlantCategories.vegetable } });

        expect(selectField.value).toBe(PlantCategories.vegetable);
    });

    it('calls the create-plant endpoint with correct data when submit button clicked', async () => {
        render(<CreateNewPlant enteredPlant="bee" onAdd={mockOnAdd}/>)

        const inputField: HTMLInputElement = screen.getByLabelText("enter-new-plant");
        const selectField: HTMLSelectElement = screen.getByTestId('category-dropdown');
        const submitButton: HTMLButtonElement = screen.getByRole('button');

        fireEvent.change(inputField, { target: { value: 'beetroot' }});
        fireEvent.change(selectField, { target: { value: PlantCategories.vegetable } });
        fireEvent.click(submitButton);

        expect(fetch).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${process.env.REACT_APP_BASE_URL}/create-plant`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mocked-token'
                  },
                  method: 'POST',
                  body: JSON.stringify({ name: 'beetroot', category: PlantCategories.vegetable }),
                }
              );
        })
        expect(mockOnAdd).toHaveBeenCalledTimes(1);
        expect(mockOnAdd).toHaveBeenCalledWith({ '_id': 'id-for-beetroot-1234', name: 'beetroot', category: 'vegetable' });
    });

    it('displays error message when plant fails to be created.', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce('Error');

        render(<CreateNewPlant enteredPlant="bee" onAdd={mockOnAdd}/>)

        const inputField: HTMLInputElement = screen.getByLabelText("enter-new-plant");
        const selectField: HTMLSelectElement = screen.getByTestId('category-dropdown');
        const submitButton: HTMLButtonElement = screen.getByRole('button');

        fireEvent.change(inputField, { target: { value: 'beetroot' }});
        fireEvent.change(selectField, { target: { value: PlantCategories.vegetable } });
        fireEvent.click(submitButton);

        expect(fetch).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${process.env.REACT_APP_BASE_URL}/create-plant`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mocked-token'
                  },
                  method: 'POST',
                  body: JSON.stringify({ name: 'beetroot', category: PlantCategories.vegetable }),
                }
              );
            expect(screen.getByText('Failed to create the new plant, beetroot. Please try again')).toBeInTheDocument();
        });
        expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('displays error message when plant already exists in db.', async () => {
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ detail: "Plant already exists" }),
            })
        );

        render(<CreateNewPlant enteredPlant="bee" onAdd={mockOnAdd}/>)

        const inputField: HTMLInputElement = screen.getByLabelText("enter-new-plant");
        const selectField: HTMLSelectElement = screen.getByTestId('category-dropdown');
        const submitButton: HTMLButtonElement = screen.getByRole('button');

        fireEvent.change(inputField, { target: { value: 'beetroot' }});
        fireEvent.change(selectField, { target: { value: PlantCategories.vegetable } });
        fireEvent.click(submitButton);

        expect(fetch).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                `${process.env.REACT_APP_BASE_URL}/create-plant`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mocked-token'
                  },
                  method: 'POST',
                  body: JSON.stringify({ name: 'beetroot', category: PlantCategories.vegetable }),
                }
              );
            expect(screen.getByText('beetroot already exists')).toBeInTheDocument();
        });
        expect(mockOnAdd).not.toHaveBeenCalled();
    });
})
