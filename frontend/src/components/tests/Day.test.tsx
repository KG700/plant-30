import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useNavigate } from 'react-router';
import { Day } from '../Day';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

describe('Day', () => {
  let mockNavigate: jest.Mock;

    beforeEach(() => {
      mockNavigate = jest.fn();
      (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        (global.fetch as jest.Mock) = jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve([
              { _id: 1, name: 'rice' },
              { _id: 2, name: 'onion' },
            ]),
          })
        );
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

    it('fetches and renders plants', async () => {
      render(<Day />);

      await waitFor(() => {
        expect(screen.getByText('rice')).toBeInTheDocument();
        expect(screen.getByText('onion')).toBeInTheDocument();
        expect(screen.getByText('Total: 2')).toBeInTheDocument();
      });
    });

    it('calls delete endpoint when plant delete button pressed', async () => {
      render(<Day />);

      await waitFor(() => {
        const onionItem: HTMLLIElement = screen.getByText("onion").closest("li") || new HTMLLIElement;
        const deleteOnionButton = within(onionItem).getByRole('button');
        fireEvent.click(deleteOnionButton);
      })

      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_BASE_URL}/user/delete-plant/2?when=today`,
            {
              headers: {
                'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
                'Authorization': 'Bearer mocked-token'
              },
              method: 'DELETE',
            }
      )
    });

    it('renders error message if plant fails to delete', async () => {
      (global.fetch as jest.Mock)
        .mockReturnValueOnce(
          {
            ok: true,
            json: () => Promise.resolve([
              { _id: 1, name: 'rice' },
              { _id: 2, name: 'onion' },
            ]),
          }
        )
        .mockReturnValueOnce(
          {
            ok: true,
            json: () => Promise.resolve([
              { _id: 1, name: 'rice' },
              { _id: 2, name: 'onion' },
            ]),
          }
        )
        .mockRejectedValue('Failed to delete')

      render(<Day />);

      await waitFor(() => {
        const onionItem: HTMLLIElement = screen.getByText("onion").closest("li") || new HTMLLIElement;
        const deleteOnionButton = within(onionItem).getByRole('button');
        fireEvent.click(deleteOnionButton);
      })

      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_BASE_URL}/user/delete-plant/2?when=today`,
        {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
                'Authorization': 'Bearer mocked-token'
          },
          method: 'DELETE',
        }
      )
      waitFor(() => {
        expect(screen.getByText('Failed to delete plant from list')).toBeInTheDocument();
      })
    });

    it('shows no plants added message if no plants are fetched', async () => {
      (global.fetch as jest.Mock) = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve([]),
        })
      );

      render(<Day />);

      await waitFor(() => {
        expect(screen.getByText('Total: 0')).toBeInTheDocument();
        expect(screen.getByText('You have not added any plants for today yet')).toBeInTheDocument();
      });
    });

    it('throws error if plants fail to fetch', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('Error fetching plants');

      render(<Day />);

      await waitFor(() => {
        expect(screen.getByText('Error fetching the plants you have eaten today')).toBeInTheDocument();
      });
    })
})
