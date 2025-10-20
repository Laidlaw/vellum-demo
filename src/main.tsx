import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import { RouterProvider } from 'react-router-dom';

import '@shopify/polaris/build/esm/styles.css';
import './styles/global.css';
import { router } from './router';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider i18n={enTranslations} colorScheme="light">
      <RouterProvider router={router} />
    </AppProvider>
  </React.StrictMode>,
);
