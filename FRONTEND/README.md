# Train Depot Simulation Frontend

## Description

A modern React frontend for the railway track occupation simulation application. This app allows you to:

- **Manage trains**: Add, edit, and delete trains with their characteristics
- **Visualize occupation**: View real-time track occupation status
- **Analyze statistics**: Charts and performance metrics
- **Multilingual support**: French, English, Danish
- **Responsive interface**: Adapts to all screen sizes

## Main Features

### 🚄 Train Management
- Add/edit form with validation
- Full train list with actions (edit, delete)
- Support for electric trains
- Management of train types (storage, testing, pit)
- Depot selection (Glostrup, Naestved)

### 📊 Visualizations
- Dashboard with key statistics
- Distribution charts (type, length, depot)
- Real-time track occupation
- Performance indicators

### 🌍 Internationalization
- Interface available in French, English, and Danish
- Complete UI translations
- Localized date/time formats

### 🎨 Modern UI
- Material-UI design
- Consistent, professional theme
- Tab-based intuitive navigation
- Fully responsive design

## Technologies Used

- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **Recharts** for data visualization
- **Axios** for API requests
- **date-fns** for date management

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

3. **Build for production**:
   ```bash
   npm run build
   ```
   The static files will be generated in the `build/` directory.

## Configuration

By default, the app connects to the FastAPI backend at `http://localhost:8000`.

To change the API URL, edit the `API_BASE_URL` constant in `src/services/api.ts`:

```typescript
// src/services/api.ts
export const API_BASE_URL = "http://localhost:8000";
```

You can also use environment variables by creating a `.env` file at the project root:

```
REACT_APP_API_BASE_URL=http://your-backend-url
```

And update `api.ts` to use `process.env.REACT_APP_API_BASE_URL`.

## Project Structure

```
src/
├── components/             # React components
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Header.tsx          # Navigation & language selector
│   ├── TrainManagement.tsx # Train CRUD management
│   ├── StatisticsView.tsx  # Visualizations & stats
│   └── DepotView.tsx       # Depot & occupation view
├── contexts/               # React contexts
│   └── LanguageContext.tsx # Language management
├── services/               # API services
│   └── api.ts              # API client
├── types/                  # TypeScript types
│   └── index.ts            # Main interfaces
├── utils/                  # Utilities
│   └── translations.ts     # Translation system
├── App.tsx                 # Main component
└── index.tsx               # Entry point
```

## Backend API

The application uses the following endpoints:

- `GET /trains` - Retrieve all trains
- `POST /trains` - Add a new train
- `PUT /trains/{id}` - Edit a train
- `DELETE /trains/{id}` - Delete a train
- `GET /statistics` - Retrieve statistics
- `GET /requirements` - Retrieve requirements
- `POST /reset` - Reset the simulation
- `POST /recalculate` - Recalculate the simulation

**Expected data format:** All endpoints return JSON. Refer to `src/types/index.ts` for interface details.

## Development

### Adding New Translations

1. Edit `src/utils/translations.ts`
2. Add new keys to the `TRANSLATIONS` object
3. Use `t('key', language)` in components

### Adding New Components

1. Create the component in `src/components/`
2. Import it in `App.tsx`
3. Integrate it into navigation if needed

### Linting & Formatting

- Use ESLint and Prettier for code quality and formatting.
- Run `npm run lint` to check for lint errors.

### Testing

- Unit tests can be added with Jest and React Testing Library.
- Run `npm test` to execute tests.

## Production

To deploy in production:

1. Build the app: `npm run build`
2. Serve the static files from the `build/` directory (e.g., with Nginx, Apache, or Vercel)
3. Configure your web server to redirect all routes to `index.html` (for SPA routing)

**Example Nginx config:**
```nginx
location / {
    try_files $uri /index.html;
}
```

## Backend Integration

Make sure your FastAPI backend:

1. Enables CORS to allow requests from the frontend
2. Exposes the required endpoints
3. Returns data in the expected JSON format

**Example CORS configuration for FastAPI:**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://web-production-76c6f.up.railway.app",
        "https://web-production-1e33b.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*", "Authorization", "Content-Type"],
)
```

## Troubleshooting

- **API connection errors**: Check that the backend is running and CORS is enabled.
- **Build issues**: Ensure Node.js and npm are up to date.
- **Translations not appearing**: Verify keys in `translations.ts` and usage in components.

## License

This project is licensed under the MIT License.

---

For any questions or contributions, please open an issue or submit a pull request!
