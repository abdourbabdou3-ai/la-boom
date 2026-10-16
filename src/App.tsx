import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Storefront from './Storefront';
import { StoreProvider } from './StoreContext';

const Admin = React.lazy(() => import('./Admin'));

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route
            path="/عياشيادمينمتجر2007"
            element={
              <React.Suspense fallback={null}>
                <Admin />
              </React.Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
