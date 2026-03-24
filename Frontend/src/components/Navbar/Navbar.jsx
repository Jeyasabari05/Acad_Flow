import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { CloudDownload, LibraryBooks, Notifications, CloudUpload, 
        CheckCircle, Assessment, History } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar'; // Import Avatar
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const hiddenMixin = {
  display: 'none',
};

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: 'white', // Set background color to white
  boxShadow: 'none', // Remove box shadow
  borderBottom: '1px solid #e0e0e0', // Add bottom border
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open, hidden }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(hidden && hiddenMixin),
    ...(open ? openedMixin(theme) : closedMixin(theme)),
    '& .MuiDrawer-paper': {
      backgroundColor: '#ffffff', // Custom background color for Drawer (White)
      borderRight: '1px solid #e0e0e0', // Custom border right color (Red)
      ...(open ? openedMixin(theme) : closedMixin(theme)),
    }
  })
);


function Navbar({ role, userName, isDrawerOpen, setDrawerOpen, isDrawerHidden, setDrawerHidden, onLogout }) {

  const theme = useTheme();
  const location = useLocation();
  const drawerRef = React.useRef(null);

  const isActive = (path) => {
    // Treat '/lesson-plan/:unitNumber' as '/upload-materials'
    if (path === '/upload-materials' && location.pathname.startsWith('/lesson-plan/')) {
      return true;
    }
    return location.pathname === path;
  };
  
  
  
  // Media Queries
  const isLargeScreen = useMediaQuery('(min-width:1200px)');
  const isMediumScreen = useMediaQuery('(min-width:500px) and (max-width:1200px)');
  const isSmallScreen = useMediaQuery('(max-width:500px)');

  const [open, setOpen] = React.useState(isLargeScreen);
  const [hidden, setHidden] = React.useState(isSmallScreen);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const openProfileMenu = Boolean(anchorEl);
  const displayName = userName || "User";

  const handleDrawerToggle = () => {
    setDrawerOpen((prev) => !prev);
    setDrawerHidden(false);
};

const handleDrawerClosed = () => {
    setDrawerOpen(false);
    setDrawerHidden(isSmallScreen); // Hide if screen is small
};

React.useEffect(() => {
  const handleOutsideClick = (event) => {
      const drawerElement = document.querySelector('.MuiDrawer-paper');
      const menuButton = document.querySelector('[aria-label="open drawer"]');

      if (
          isDrawerOpen &&
          window.innerWidth <= 500 &&
          drawerElement &&
          !drawerElement.contains(event.target) &&
          !menuButton.contains(event.target)
      ) {
          setDrawerOpen(false);
          setDrawerHidden(true);
      }
  };

  document.addEventListener('mousedown', handleOutsideClick);

  return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
  };
}, [isDrawerOpen]);


React.useEffect(() => {
  const handleResize = () => {
      if (window.innerWidth > 1200) {
          setDrawerOpen(true);
          setDrawerHidden(false);
      } else if (window.innerWidth <= 1200 && window.innerWidth > 500) {
          setDrawerOpen(false);
          setDrawerHidden(false);
      } else {
          setDrawerOpen(false); // Ensure drawer is closed by default on small screens
          setDrawerHidden(true);
      }
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // Call it once initially
  return () => window.removeEventListener('resize', handleResize);
}, [setDrawerOpen, setDrawerHidden]);


  // Profile Menu Handlers
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    handleProfileMenuClose();
  };

  // Define the available menu options based on the role
  const menuOptions = {
    Student: [
      { text: 'Student Dashboard', icon: <DashboardRoundedIcon />, link: '/' },
      { text: 'Complaint Status', icon: <CloudDownload />, link: '/ComplaintStatus' },
      
    ],
    Faculty: [
      { text: 'Faculty Dashboard', icon: <DashboardRoundedIcon />, link: '/' },
      { text: 'Notification', icon: <Notifications />, link: '/notifications' },
      { text: 'Upload Materials', icon: <CloudUpload />, link: '/upload-materials' },
      { text: 'Activity Status', icon: <Assessment />, link: '/activity-status' },
    ],
    Admin: [
      { text: 'Admin Dashboard', icon: <DashboardRoundedIcon />, link: '/' },
      { text: 'Faculty Assignment', icon: <PersonSearchRoundedIcon />, link: '/faculty-assignment' },
      { text: 'Complaint Review', icon: <CheckCircle />, link: '/complaint-review' },
      { text: 'Score Monitoring', icon: <Assessment />, link: '/faculty-score-monitoring' },
      { text: 'Materials Monitoring', icon: <History />, link: '/lecture-materials-monitoring' }
    ]
  };
  

  // const roleMenuItems = menuOptions[role];
  // Ensure roleMenuItems is always an array
  const roleMenuItems = menuOptions[role] || [];

  return (
    <Box sx={{ display: 'flex', position: 'fixed', zIndex: 1000 }}>
      <CssBaseline />
      <AppBar position="fixed" open={isDrawerOpen}>
  <Toolbar>
    {/* Menu Button */}
    <IconButton
  aria-label="open drawer"
  onClick={handleDrawerToggle}
  edge="start"
  sx={{
    marginRight: 5,
    color: '#673ab7',
    ...(isDrawerOpen && { display: 'none' }),
  }}
>
  <SortRoundedIcon sx={{ fontSize: '2rem', fontWeight: '900' }} />
</IconButton>


    {/* Conditionally Render Acad Flow Text */}
    {!isDrawerOpen && (
      <Typography
        variant="h6"
        noWrap
        component="div"
        sx={{
          color: '#673ab7',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: "'Diphylleia', serif",
          fontWeight: 800,
          fontSize: '1.25rem',
        }}
      >
        <FontAwesomeIcon 
        icon={faGraduationCap} 
        style={{ fontSize: '26px', fontWeight: 'bold', color: '#673ab7' }} // Custom font size
      />
        Acad Flow
      </Typography>
    )}

    {/* Spacer to push Avatar to the right */}
    <Box sx={{ flexGrow: 1 }} />

    {/* Avatar Icon */}
<IconButton color="inherit" onClick={handleProfileMenuOpen}>
  <Avatar
    sx={{
      bgcolor: '#673ab7', // Background color of Avatar
      color: 'white',    // Text color inside Avatar
      fontWeight: 'bold' // Optional: Make the letter bold
    }}
  >
    {displayName.charAt(0).toUpperCase()}
  </Avatar>
</IconButton>
<Menu
  anchorEl={anchorEl}
  open={openProfileMenu}
  onClose={handleProfileMenuClose}
>
  <MenuItem disabled>
    {/* Center the name */}
    <Typography
      variant="subtitle1"
      sx={{
        textAlign: 'center', // Center the name
        width: '100%', // Take full width for centering
        fontWeight: 'bold', // Optional: Make the name bold
        color: '#673ab7', // Purple text color for name
        padding: '0px 0', // Add padding for better spacing
      }}
    >
      <strong>{displayName}</strong>
    </Typography>
  </MenuItem>
  <Divider />
  <MenuItem onClick={handleLogout}>
    {/* Button with purple background, no box-shadow, and attractive hover effect */}
    <Button
      fullWidth
      variant="contained"
      color="primary"
      onClick={onLogout}
      sx={{
        gap: '10px',
        backgroundColor: '#fff', // Purple background
        color: '#673ab7', // Text color white
        padding: '8px 12px 8px 12px', // Adjust padding for better size
        borderRadius: '5px', // Rounded corners for button
        fontWeight: 'bold',
        border: '1px solid #673ab7',
        '&:hover': {
          backgroundColor: '#5e2d94', // Darker purple on hover
          boxShadow: 'none', // Remove box shadow on hover
          color: 'white',
        },
        '&:active': {
          backgroundColor: '#4a2378', // Even darker purple when clicked
        },
        boxShadow: 'none', // Remove box shadow from default state
      }}
    >
      <LogoutIcon />
      Log Out
    </Button>
  </MenuItem>
</Menu>


  </Toolbar>
</AppBar>

<Drawer ref={drawerRef} variant="permanent" open={isDrawerOpen} hidden={isDrawerHidden}>
  {/* Drawer Header */}
  <DrawerHeader>
    <Typography 
      variant="h6" 
      noWrap 
      component="div" 
      sx={{ 
        flexGrow: 1, 
        color: '#673ab7', // Text color (purple)
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '10px', // Spacing between icon and text
        fontFamily: "'Diphylleia', serif", // Custom font
        fontWeight: 800, // Bold font weight
        fontSize: '1.25rem' // Font size
      }}
    >
      <FontAwesomeIcon 
        icon={faGraduationCap} 
        style={{ fontSize: '30px', fontWeight: 'bold', color: '#673ab7' }} // Custom font size
      />
      Acad Flow
    </Typography>
    <IconButton onClick={handleDrawerClosed} sx={{color: '#673ab7'}}>
      {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </IconButton>
  </DrawerHeader>

  {/* Menu Options List */}
  {/* Menu Options List */}
<List sx={{ marginTop: '20px' }}>
  {/* Render menu options dynamically */}
  {roleMenuItems.map((item) => (
    <ListItem key={item.text} disablePadding sx={{ display: 'block', paddingLeft: !isDrawerOpen ? '0px' : '5px', paddingRight: '5px' }}>
      {/* Navigation Link for each Menu Item */}
      <ListItemButton
        component={Link} // Use Link for navigation
        to={item.link} // Use 'link' property from menuOptions
        onClick={() => {
          if (window.innerWidth < 768) {
            setDrawerOpen(false); // Close drawer if screen width < 768px
            setDrawerHidden(true);
          }
        }}
        sx={{ 
          justifyContent: isDrawerOpen ? 'initial' : 'center', 
          gap: isDrawerOpen ? '20px' : '0px', 
          marginBottom: '10px',
          marginLeft: isDrawerOpen ? '0px' : '5px', 
          padding: '8px 16px', // Add padding to each item
          borderRadius: '8px', // Rounded corners
          '&:hover': {
            backgroundColor: 'rgba(128, 0, 255, 0.1)', // Light purple background on hover
          },
          '&.active': {
            backgroundColor: '#673ab7', // Purple background for active item
            color: '#fff', // White text for active item
          },
        }}
        className={isActive(item.link) ? 'active' : ''} // Add active class when selected
      >
        {/* Icon Styling */}
        <ListItemIcon
          sx={{
            minWidth: 0,
            justifyContent: 'center',
            fontSize: '1.5rem', // Icon size
            fontWeight: 'bold', // Bold icon
            color: isActive(item.link) ? '#fff' : '#757575', // Change color based on active state
          }}
        >
          {item.icon}
        </ListItemIcon>
        
        {/* Text Styling */}
        <ListItemText 
          primary={item.text}
          sx={{ opacity: isDrawerOpen ? 1 : 0 }}
          primaryTypographyProps={{ 
            fontWeight: 'bold', 
            color: isActive(item.link) ? '#fff' : '#757575', // Text color based on active state
          }}
        />
      </ListItemButton>
    </ListItem>
  ))}
</List>

</Drawer>
    </Box>
  );
}

export default Navbar;
