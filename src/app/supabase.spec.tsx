
import { render, screen } from '@testing-library/react';
import Home from './page';

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
}));

describe('Home Page', () => {
  it('renders the heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', {
      name: /Where engineering teams ship faster/i,
    });
    expect(heading).toBeInTheDocument();
  });
});
