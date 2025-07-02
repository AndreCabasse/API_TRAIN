import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Avatar,
  useTheme,
  Menu,
} from '@mui/material';
import {
  Train as TrainIcon,
  Dashboard as DashboardIcon,
  BarChart as StatsIcon,
  Business as DepotIcon,
  Map as MapIcon,
  SportsEsports as GameIcon,
  Language as LanguageIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { t, Language } from '../utils/translations';
import TimelineIcon from '@mui/icons-material/Timeline';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { language, setLanguage } = useLanguage();
  const theme = useTheme();

  // État pour le menu profil
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (event: any) => {
    setLanguage(event.target.value as Language);
  };

  const tabs = [
    { id: 'dashboard', label: t('dashboard', language), icon: <DashboardIcon /> },
    { id: 'trains', label: t('trains', language), icon: <TrainIcon /> },
    { id: 'statistics', label: t('statistics', language), icon: <StatsIcon /> },
    { id: 'depots', label: t('depots', language), icon: <DepotIcon /> },
    { id: 'gantt', label: 'Gantt', icon: <TimelineIcon /> },
    { id: 'map', label: 'Carte', icon: <MapIcon /> },
    { id: 'game', label: 'Mini-jeu', icon: <GameIcon /> },
  ];

  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'linear-gradient(90deg,#23272F 60%, #757575 100%)',
        boxShadow: 3,
        zIndex: theme.zIndex.drawer + 1,
      }}
      elevation={4}
    >
      <Toolbar>
        {/* Logo + Titre */}
        <Box display="flex" alignItems="center" sx={{ mr: 3 }}>
          <IconButton edge="start" sx={{ p: 0, mr: 1 }}>
            <img
              src="/DSB1.png"
              alt="Logo DSB1"
              style={{ height: 40, transition: 'transform 0.2s', borderRadius: 8 }}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: 1, color: '#fff' }}>
            {t('title', language)}
          </Typography>
        </Box>
        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexGrow: 1 }}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              color="inherit"
              startIcon={tab.icon}
              onClick={() => onTabChange(tab.id)}
              sx={{
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.18)' : 'transparent',
                borderRadius: 2,
                fontWeight: 600,
                color: '#fff',
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.12)',
                },
                transition: 'background 0.2s',
              }}
            >
              {tab.label}
            </Button>
          ))}
          {/* Sélecteur de langue */}
          <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
            <InputLabel
              sx={{
                color: 'white',
                pl: 1.5,
                background: 'rgba(35,39,47,0.85)',
                borderRadius: 1,
                mt: '-4px',
              }}
            >
              <LanguageIcon sx={{ mr: 1, fontSize: 'small' }} />
              {t('language', language)}
            </InputLabel>
            <Select
              value={language}
              onChange={handleLanguageChange}
              sx={{
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '.MuiSvgIcon-root': {
                  color: 'white',
                },
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 1,
              }}
            >
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="da">Dansk</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {/* Profil utilisateur avec menu */}
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleProfileClick}>
            <Avatar sx={{ bgcolor: '#fff', color: '#23272F', width: 36, height: 36 }}>
              <AccountCircle sx={{ fontSize: 32 }} />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
              <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 220 }}>
                <Avatar sx={{ bgcolor: '#fff', color: '#23272F', width: 36, height: 36 }}>
                  <AccountCircle sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Jean Dupont</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>jean.dupont@email.com</Typography>
                </Box>
              </Box>
              <Box sx={{ my: 1, borderBottom: '1px solid #eee' }} />
            <MenuItem onClick={handleClose}>Profil</MenuItem>
            <MenuItem onClick={handleClose}>Paramètres</MenuItem>
            <MenuItem onClick={handleClose}>Déconnexion</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;