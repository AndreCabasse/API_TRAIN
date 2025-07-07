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
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
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
import { useUser } from '../contexts/UserContext';
import HistoryIcon from '@mui/icons-material/History';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { language, setLanguage } = useLanguage();
  const theme = useTheme();
  const { user, logout } = useUser();

  // Responsive drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Profil menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isSmallScreen = useMediaQuery('(max-width:1100px)');

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLanguageChange = (event: any) => {
    setLanguage(event.target.value as Language);
  };
  const handleDrawerToggle = () => {
    setDrawerOpen((prev) => !prev);
  };

  const tabs = [
    { id: 'dashboard', label: t('dashboard', language), icon: <DashboardIcon /> },
    { id: 'trains', label: t('trains', language), icon: <TrainIcon /> },
    { id: 'statistics', label: t('statistics', language), icon: <StatsIcon /> },
    { id: 'depots', label: t('depots', language), icon: <DepotIcon /> },
    { id: 'gantt', label: 'Gantt', icon: <TimelineIcon /> },
    { id: 'map', label: t('Carte', language), icon: <MapIcon /> },
    { id: 'game', label: t('game', language), icon: <GameIcon /> },
    { id: 'history', label: t('history', language), icon: <HistoryIcon /> },
  ];

  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'linear-gradient(90deg,#23272F 60%, #757575 100%)',
        boxShadow: 3,
        zIndex: theme.zIndex.drawer + 1,
        width: { xs: '100vw', sm: '100vw', md: '100vw', lg: '100vw' },
        left: 0,
        right: 0,
      }}
      elevation={4}
    >
      <Toolbar
        sx={{
          px: { xs: 1, sm: 2, md: 3 },
          minHeight: { xs: 56, sm: 64, md: 72 },
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo + Titre avec fond et ombre */}
        <Box
          display="flex"
          alignItems="center"
          sx={{
            mr: { xs: 1, sm: 2, md: 3 },
            px: { xs: 1, sm: 2 },
            py: { xs: 0.5, sm: 1 },
            borderRadius: 3,
            background: 'rgba(40,44,52,0.85)',
            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
            backdropFilter: 'blur(4px)',
            minWidth: { xs: 0, sm: 120, md: 180 },
            maxWidth: { xs: 180, sm: 260, md: 400 },
          }}
        >
          <IconButton edge="start" sx={{ p: 0, mr: { xs: 0.5, sm: 1 } }}>
            <img
              src="/DSB1.png"
              alt="Logo DSB1"
              style={{ height: 32, maxHeight: 40, width: 'auto', transition: 'transform 0.2s', borderRadius: 8 }}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              letterSpacing: 1,
              color: '#fff',
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              ml: { xs: 0.5, sm: 1 },
              maxWidth: { xs: 90, sm: 180, md: 300 },
            }}
          >
            {t('title', language)}
          </Typography>
        </Box>
        <Box sx={{ width: 2, height: { xs: 32, sm: 40, md: 48 }, bgcolor: 'rgba(255,255,255,0.12)', mx: { xs: 1, sm: 2 }, borderRadius: 1, display: { xs: 'none', sm: 'block' } }} />
        {/* Responsive navigation */}
        {isSmallScreen ? (
          <>
            <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ ml: 1 }}>
              <span className="material-icons">menu</span>
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerToggle}>
              <Box sx={{ width: { xs: 220, sm: 270 }, p: 2 }} role="presentation" onClick={handleDrawerToggle}>
                <List>
                  {tabs.map((tab) => (
                    <ListItem button key={tab.id} selected={activeTab === tab.id} onClick={() => onTabChange(tab.id)}>
                      <ListItemIcon>{tab.icon}</ListItemIcon>
                      <ListItemText primary={tab.label} />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
                <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                  <InputLabel><LanguageIcon sx={{ mr: 1, fontSize: 'small' }} />{t('language', language)}</InputLabel>
                  <Select value={language} onChange={handleLanguageChange}>
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="da">Dansk</MenuItem>
                  </Select>
                </FormControl>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ bgcolor: '#fff', color: '#23272F', width: 36, height: 36 }}>
                    <AccountCircle sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user?.username || "Utilisateur"}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user?.email || ""}</Typography>
                  </Box>
                </Box>
                <List>
                  <ListItem button onClick={() => onTabChange('profile')}><ListItemText primary={t('Profile', language)} /></ListItem>
                  <ListItem button onClick={logout}><ListItemText primary={t('logout_button', language)} /></ListItem>
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            <Box sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              alignItems: 'center',
              flexGrow: 1,
              flexWrap: 'wrap',
              minWidth: 0,
              overflowX: 'auto',
            }}>
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  color="inherit"
                  startIcon={tab.icon}
                  onClick={() => onTabChange(tab.id)}
                  sx={{
                    backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.18)' : 'transparent',
                    borderRadius: 3,
                    fontWeight: 600,
                    color: '#fff',
                    px: 2.5,
                    position: 'relative',
                    boxShadow: activeTab === tab.id ? '0 2px 8px 0 rgba(255,23,68,0.08)' : undefined,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.16)',
                      boxShadow: '0 2px 8px 0 rgba(255,23,68,0.10)',
                    },
                    transition: 'all 0.2s',
                    '&::after': activeTab === tab.id
                      ? {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          left: 18,
                          right: 18,
                          bottom: 4,
                          height: 3,
                          borderRadius: 2,
                          background: 'linear-gradient(90deg,#fff,#ff1744)',
                          transition: 'all 0.25s',
                        }
                      : {},
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              ml: { xs: 0.5, sm: 2 },
              gap: { xs: 1, sm: 2 },
              flexShrink: 0,
            }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
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
              {/* Profil utilisateur */}
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.username || "Utilisateur"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {user?.email || ""}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ my: 1, borderBottom: '1px solid #eee' }} />
                <MenuItem onClick={() => { onTabChange('profile'); handleClose(); }}>
                  {t('Profile', language)}
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  {t('Parameters', language)}
                </MenuItem>
                <MenuItem onClick={() => { logout(); handleClose(); }}>
                  {t('logout_button', language)}
                </MenuItem>
              </Menu>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;