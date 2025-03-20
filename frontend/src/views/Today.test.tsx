import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

      it('throws error if plants fail to fetch', async () => {
        (global.fetch as jest.Mock).mockRejectedValue('Error fetching plants');

        render(<Today />);

        await waitFor(() => {
          expect(screen.getByText('Error fetching plants')).toBeInTheDocument();
        });
      })
})
