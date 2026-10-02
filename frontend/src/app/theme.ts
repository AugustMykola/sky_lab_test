import { createTheme } from '@mui/material';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: '#3b5bdb' },
    background: { default: '#f6f7fb' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
});
