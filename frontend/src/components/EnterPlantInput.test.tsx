import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EnterPlantInput } from "./EnterPlantInput";

describe('EnterPlantInput', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve([
              { _id: 1, name: 'apple' },
              { _id: 2, name: 'pear' },
            ]),
          })
        );
      })

    it('submits plant when entered', async () => {
        const userId = '67bc93477fcac69fbfe17d44';

        render(<EnterPlantInput />);

        const inputField: HTMLInputElement = screen.getByLabelText('enter-plant');
        fireEvent.click(inputField);

        waitFor(() => {
          const appleListItem = screen.getByText('apple');
          fireEvent.click(appleListItem);
        })

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_BASE_URL}/user/${userId}/add-plant/1`,
            {
              headers: {
                'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
              },
              method: 'POST',
            }
          );
        })
        expect(screen.queryByTestId('plant-dropdown')).not.toBeInTheDocument();
        expect(inputField.value).toBe('');
      })

      it('updates enteredPlant state when input changes', () => {
        render(<EnterPlantInput />);
        const inputField: HTMLInputElement = screen.getByLabelText('enter-plant');
        fireEvent.change(inputField, { target: { value: 'app' } });
        expect(inputField.value).toBe('app');
      });

      it('opens the dropdown when input is clicked', async () => {
        render(<EnterPlantInput />);
        const inputField = screen.getByLabelText('enter-plant');
        fireEvent.click(inputField);
        await waitFor(() => {
          expect(screen.getByTestId('plant-dropdown')).toBeVisible();
        });
      });

      it('closes the dropdown when clicking outside', async () => {
        render(<EnterPlantInput />);
        const inputField = screen.getByLabelText('enter-plant');
        fireEvent.click(inputField);
        await waitFor(() => {
          expect(screen.getByTestId('plant-dropdown')).toBeVisible();
        });
        fireEvent.click(document.body); // Simulate click outside
        expect(screen.queryByTestId('plant-dropdown')).not.toBeInTheDocument();
      });

      it('fetches plants when input changes', async () => {
        render(<EnterPlantInput />);

        const inputField = screen.getByLabelText('enter-plant');
        fireEvent.change(inputField, { target: { value: 'ap' } });

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_BASE_URL}/plants/search?q=ap`,
            expect.any(Object)
          );
        });
      });

      it('displays error message if fetching plants fails', async () => {
        (global.fetch as jest.Mock) = jest.fn(() => Promise.reject('Fetch Error'));

        render(<EnterPlantInput />);

        const inputField = screen.getByLabelText('enter-plant');
        fireEvent.click(inputField);

        await waitFor(() => {
          expect(screen.getByText('Error fetching plants')).toBeVisible();
        });
      });

      it('submits a plant on pressing Enter or Space on a dropdown item', async () => {
        render(<EnterPlantInput />);

        // Open the dropdown
        const inputField = screen.getByLabelText('enter-plant');
        fireEvent.click(inputField);

        // Wait for the dropdown to appear
        await waitFor(() => {
          screen.getByText('apple');
        });

        const appleListItem = screen.getByText('apple');

        // Focus the list item (important for keyboard events)
        appleListItem.focus();

        // Simulate pressing Enter
        fireEvent.keyDown(appleListItem, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_BASE_URL}/user/67bc93477fcac69fbfe17d44/add-plant/1`,
            expect.any(Object)
          );
        });
      });
});
