import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Today } from './Today';

describe('Today', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve([
              { id: 1, name: 'rice' },
              { id: 2, name: 'onion' },
            ]),
          })
        );
      })

    it('fetches and renders plants', async () => {
        render(<Today />);

        await waitFor(() => {
          expect(screen.getByText('rice')).toBeInTheDocument();
          expect(screen.getByText('onion')).toBeInTheDocument();
          expect(screen.getByText('Number of plants eaten today: 2')).toBeInTheDocument();
        });
      });

      it('shows no plants added message if no plants are fetched', async () => {
        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve([]),
          })
        );

        render(<Today />);

        await waitFor(() => {
          expect(screen.getByText('Number of plants eaten today: 0')).toBeInTheDocument();
          expect(screen.getByText('You have not added any plants for today yet')).toBeInTheDocument();
        });
      });

      it('throws error if plants fail to fetch', async () => {
        (global.fetch as jest.Mock).mockRejectedValue('Error fetching plants');

        render(<Today />);

        await waitFor(() => {
          expect(screen.getByText('Error fetching plants')).toBeInTheDocument();
        });
      })

      it('submits plant when entered', async () => {
        const userId = '67bc93477fcac69fbfe17d44';
        const plantId = '67bdca3d86bc1187fad97937';

        render(<Today />);

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

        render(<Today />);

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
})
