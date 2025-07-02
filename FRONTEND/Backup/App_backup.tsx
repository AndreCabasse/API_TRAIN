import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TrainManagement from './components/TrainManagement';
import StatisticsView from './components/StatisticsView';
import DepotView from './components/DepotView';
import MapView from './components/MapView';
import GameView from './components/GameView';
import GanttView from './components/GanttView';
import { UserProvider } from './contexts/UserContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'trains':
        return <TrainManagement />;
      case 'statistics':
        return <StatisticsView />;
      case 'depots':
        return <DepotView />;
      case 'gantt':
        return <GanttView />;
      case 'map':
        return <MapView />;
      case 'game':
        return <GameView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <LanguageProvider>
          <Box sx={{ flexGrow: 1 }}>
            <Header activeTab={activeTab} onTabChange={setActiveTab} />
            <main>
              {renderContent()}
            </main>
          </Box>
        </LanguageProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;