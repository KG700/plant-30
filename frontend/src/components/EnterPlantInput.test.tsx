import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EnterPlantInput } from "./EnterPlantInput";

describe('EnterPlantInput', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock) = jest.fn();
      })

    it('submits plant when entered', async () => {
        const userId = '67bc93477fcac69fbfe17d44';
        const plantId = '67bdca3d86bc1187fad97937';

        render(<EnterPlantInput />);

        const inputField = screen.getByLabelText('enter-plant');
        const submitButton = screen.getByRole('button', { name: /Submit/i });

        act(() => {
          fireEvent.change(inputField, { target: { value: 'apple' } });
          fireEvent.click(submitButton);
        })

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_BASE_URL}/user/${userId}/add-plant/${plantId}`,
            {
              headers: {
                'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
              },
              method: 'POST',
            }
          );
        })
      })

      it('displays error and does not submit plant when nothing is entered', async () => {

        render(<EnterPlantInput />);

        const inputField = screen.getByLabelText('enter-plant');
        const submitButton = screen.getByRole('button', { name: /Submit/i });

        act(() => {
          fireEvent.change(inputField, { target: { value: '' } });
          fireEvent.click(submitButton);
        })

        await waitFor(() => {
          expect(global.fetch).not.toHaveBeenCalledWith(
            expect.objectContaining({
              method: "POST"
            })
          );
          expect(screen.getByText('Error, must enter a plant before submitting'))
        })
      })
});
