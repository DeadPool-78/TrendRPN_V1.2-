import { createBrowserRouter } from 'react-router-dom';
import type { RouterConfig } from '@remix-run/router';
import { routes } from './routes';

export const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_normalizeFormMethod: true
  } as RouterConfig['future']
});
