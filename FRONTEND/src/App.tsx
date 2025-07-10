import React, { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { UserProvider, useUser } from "./contexts/UserContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import TrainManagement from "./components/TrainManagement";
import StatisticsView from "./components/StatisticsView";
import DepotView from "./components/DepotView";
import GanttView from "./components/GanttView";
import MapView from "./components/MapView";
import SideNav from "./components/SideNav";
import GameView from "./components/GameView";
import ProfileView from "./components/ProfileView";
import LoginRegister from "./components/LoginRegister";
import HistoryView from "./components/HistoryView";
import Box from '@mui/material/Box';

// Define the main theme for the application using Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// MainApp handles the core logic and layout of the application
function MainApp() {
  // State to track the currently active tab/view
  const [activeTab, setActiveTab] = useState("dashboard");
  // Get the current user from context
  const { user } = useUser();

  // If the user is not logged in, show the login/register form
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginRegister />
      </ThemeProvider>
    );
  }

  // Render the main content based on the selected tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "trains":
        return <TrainManagement />;
      case "statistics":
        return <StatisticsView />;
      case "depots":
        return <DepotView />;
      case "gantt":
        return <GanttView />;
      case "map":
        return <MapView />;
      case "game":
        return <GameView />;
      case "profile":
        return <ProfileView />;
      case "history":
        //return <HistoryView />;
        return <HistoryView onLoadSimulation={() => setActiveTab("trains")} />;
      default:
        return <Dashboard />;
    }
  };

  // Main layout: header, side navigation, and main content area
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Top navigation bar with tab selection */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <Box sx={{ display: "flex" }}>
        {/* Side navigation menu */}
        <SideNav activeTab={activeTab} onTabChange={setActiveTab} />
        {/* Main content area with background image and opacity overlay */}
        <Box
          sx={{
            flexGrow: 1,
            marginTop: 8,
            p: 2,
            minHeight: "100vh",
            position: "relative", // Needed for overlay positioning
            overflow: "hidden",
            backgroundImage: 'url("/FOND_DSB.jpg")', // Background image for the app
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            transition: "background-image 0.3s",
          }}
        >
          {/* Semi-transparent white overlay for readability */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(255,255,255,0.65)", // White opacity overlay
              zIndex: 0,
              pointerEvents: "none", // Allow clicks to pass through
            }}
          />
          {/* Main content rendered above the overlay */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// App wraps MainApp with user and language context providers
function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </UserProvider>
  );
}

export default App;