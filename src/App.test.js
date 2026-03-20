import { render, screen } from '@testing-library/react';
import Register from './Pages/Register.jsx';

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => () => {},
    Link: ({ children }) => <a href="/">{children}</a>
  }),
  { virtual: true }
);

test('renders register form', () => {
  render(<Register />);
  expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
});
