import { render, screen } from '@testing-library/react';
import App from './App';

test('renders academic system login header', () => {
  render(<App />);
  const headerElement = screen.getByText(/ISALMS/i);
  expect(headerElement).toBeInTheDocument();
  const studentButton = screen.getByText(/طالب/i);
  expect(studentButton).toBeInTheDocument();
});
