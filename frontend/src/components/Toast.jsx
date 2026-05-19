import React from 'react';
import { Toaster } from 'react-hot-toast';

const Toast = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Define default options
        duration: 4000,
        style: {
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#cbd5e1',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          fontSize: '13px',
          padding: '12px 16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
};

export default Toast;
