import { render, screen, waitFor } from "@testing-library/react";
import { Week } from "./Week";

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
  }));

describe('Week', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({
              json: () => Promise.resolve([
                { _id: 1, name: 'rice', category: 'grain' },
                { _id: 2, name: 'onion', category: 'vegetable' },
              ]),
            })
        );
    })

    it('fetches and renders plants', async () => {
        waitFor(() => {
          render(<Week />);
        })

          screen.debug();

          await waitFor(() => {
            expect(screen.getByText('Grains')).toBeInTheDocument();
            expect(screen.getByText('rice')).toBeInTheDocument();
            expect(screen.getByText('Vegetables')).toBeInTheDocument();
            expect(screen.getByText('onion')).toBeInTheDocument();
            expect(screen.getByText('Nuts & Seeds')).not.toBeInTheDocument();
            expect(screen.getByText('Number of plants eaten this week: 2')).toBeInTheDocument();
          });
    });

    it('shows no plants added message if no plants are fetched', async () => {
          (global.fetch as jest.Mock) = jest.fn(() =>
            Promise.resolve({
              json: () => Promise.resolve([]),
            })
          );

          render(<Week />);

          await waitFor(() => {
            expect(screen.getByText('Number of plants eaten this week: 0')).toBeInTheDocument();
            expect(screen.getByText('You have not added any plants this week yet')).toBeInTheDocument();
          });
    });

    it('throws error if plants fail to fetch', async () => {
          (global.fetch as jest.Mock).mockRejectedValue('Error fetching plants');

          render(<Week />);

          await waitFor(() => {
            expect(screen.getByText('Error fetching the plants you have eaten this week')).toBeInTheDocument();
          });
    })
})
