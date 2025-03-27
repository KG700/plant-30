import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EnterPlantInput } from "./EnterPlantInput";
import userEvent from "@testing-library/user-event";

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

        act(() => {
          const inputField = screen.getByLabelText('enter-plant');
          fireEvent.click(inputField);
        })

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
      })
});
