// -*- coding: utf-8 -*-
// Copyright (c) 2025 André CABASSE 
// All rights reserved.
//
// This software is licensed under the MIT License.
// See the LICENSE file for details.
// Contact: andre.cabasse.massena@gmail.com

import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create a root container for the React application using the element with id 'root'
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the main App component inside React.StrictMode for highlighting potential problems
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);