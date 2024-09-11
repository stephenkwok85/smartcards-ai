'use client'

import { AppBar, Toolbar, Typography, Button, Box, Tooltip, CircularProgress, IconButton, Grid, Card, CardActionArea, CardContent} from "@mui/material";
import { useUser } from '@clerk/nextjs'; 
import {SignedIn, SignedOut, UserButton} from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter} from 'next/navigation';
import { collection, doc, getDoc, setDoc} from 'firebase/firestore'
import { db } from '@/firebase'
import Link from 'next/link';

// drawer menu imports
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import CssBaseline from '@mui/material/CssBaseline';
import HomeIcon from '@mui/icons-material/Home';
import StyleIcon from '@mui/icons-material/Style';
import QueueIcon from '@mui/icons-material/Queue';
// theme imports
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import { grey, teal, blue, cyan, green, orange, pink, lightBlue} from '@mui/material/colors';

// site theme
const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", "Lato", "Arial", sans-serif',
  },
  palette: {
    background: {
      default: grey[100],  // set the default background color for the whole app
    },
    primary: {
      main: teal[500],    // primary color
    },
    secondary: {
      main: "#ffffff",    // secondary color
    },
  }
});
// drawer menu width
const drawerWidth = 70;
//  custom Tooltip component, for drawer menu
const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: '#ffffff', 
    color: teal[500], 
    fontSize: '14px', 
    borderRadius: '5px',
    boxShadow: theme.shadows[1], 
    padding: '6px 12px',
  },
}));

const UserDashboard = () => {
    const { user, isLoaded, isSignedIn } = useUser(); // Get the current user and loading status
    const displayName = user?.firstName || user?.username || ''; // fallback to username if firstName is null
    const [loading, setLoading] = useState(true);

    const [activeButton, setActiveButton] = useState('home');
    const [flashcards, setFlashcards] = useState([])
    const router = useRouter()

    const getFlashcards = async () => {
        if (!user) return
        const docRef = doc(collection(db, 'users'), user.id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            const collections = docSnap.data().flashcards || []
            console.log(collections)
            setFlashcards(collections)
        } else {
            await setDoc(docRef, {flashcards: []})
        }
     }

    useEffect(() => {
        getFlashcards()
    }, [user])

    const handleButtonClick = (buttonName) => {
      setActiveButton(buttonName);
    };

    useEffect(() => {
        if (isLoaded) {
            setLoading(false); // set loading to false until the user data is loaded
        }
    }, [isLoaded]);

    if (loading) {
      return (
          <ThemeProvider theme={theme}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                  <CircularProgress />
              </Box>
          </ThemeProvider>
      );
    } 

    const handleCardClick = (id) => {
      router.push(`/flashcard?id=${id}`)
    }

    return (
      <ThemeProvider theme={theme}>
        <Box maxWidth="100vw">
          {/* app bar */}
          <CssBaseline />
          <AppBar position="fixed" sx={{ boxShadow: 'none', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" style={{flexGrow: 1}}>
                SmartCardsAI
              </Typography>
              {/* if signed out, display log in or sign up button */}
              <SignedOut>
                <Button color = "inherit" href="/sign-in">Log In</Button>
                <Button color = "inherit" href="sign-up">Sign Up</Button>
              </SignedOut>
              {/* if signed in, display user icon */}
              <SignedIn>
                <UserButton />
              </SignedIn>
            </Toolbar>
          </AppBar>

          {/* menu drawer */}
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', borderRight: 'none' },
              backgroundColor: theme.palette.primary.main,
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto', display: "flex", flexDirection: "column", alignItems: "center"}}>
              <List sx={{py: 4}}>
                <ListItem disablePadding>
                  <CustomTooltip title="Home" placement="right">
                    <IconButton aria-label="home" size="large" color="primary" onClick={() => handleButtonClick('home')}
                      sx={{
                        backgroundColor: activeButton === 'home' ? teal[100] : 'transparent',
                        '&:hover': {
                          backgroundColor: activeButton === 'home' ? teal[100] : theme.palette.action.hover,
                        },
                      }}
                      href="/userDashboard"
                    >
                      <HomeIcon fontSize="inherit" />
                    </IconButton>
                  </CustomTooltip>
                </ListItem>
                <ListItem disablePadding>
                  <CustomTooltip title="Your Sets" placement="right">
                    <IconButton aria-label="library" size="large" color="primary" href="/flashcards">
                      <StyleIcon fontSize="inherit" />
                    </IconButton>
                  </CustomTooltip>
                </ListItem>
                <ListItem disablePadding>
                  <CustomTooltip title="Create Sets" placement="right">
                    <IconButton aria-label="Create Sets" size="large" color="primary" href="/generate">
                      <QueueIcon fontSize="inherit" />
                    </IconButton>
                  </CustomTooltip>
                </ListItem>
              </List>
              <Divider/>
            </Box>
          </Drawer>

          {/* user dashboard */}
          <Box
              sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", pt: 14, pl: 14, pr: 6}}
              height="100vh"
          >
            <Typography variant="h4" sx={{fontWeight: "bold"}}>
              Welcome Back{displayName ? `, ${displayName}` : ''}!
            </Typography>
            <Box sx={{width: "100%", mb: 4}}>
              <Typography variant="h5" sx={{mt: 4, fontWeight: "bold"}}>Jump back into studying</Typography>
              <Grid container spacing={3} sx={{ mt: 0 }}>
                {flashcards.length === 0 ? (
                  <Card sx={{ borderRadius: '10px', width: "100%", m: 2 }}>
                    <Link href="/generate" passHref style={{ textDecoration: 'none' }}>
                      <CardActionArea sx={{ py: 6 }}>
                        <CardContent>
                          <Typography variant="h6" align="center" sx={{ color: '#000000', textDecoration: 'none' }}>
                            Create a study set to get started! 📚
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Link>
                  </Card>
                ) : (
                  flashcards.slice(-8).map((flashcard, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Card sx={{ borderRadius: '10px' }}>
                        <CardActionArea sx={{ py: 6 }} onClick={() => handleCardClick(flashcard.name)}>
                          <CardContent sx={{ mx: 2 }}>
                            <Typography variant="h6">
                              {flashcard.name}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
            <Box sx={{width: "100%"}}>
              <Typography variant="h5" sx={{mt: 4, fontWeight: "bold"}}>Generate study materials in seconds</Typography>
              <Button variant="contained" color="primary" sx={{mt:2, p:3, borderRadius: "10px"}} href="/generate" fullWidth>Generate Sets</Button>
            </Box>
          </Box>
      </Box>
    </ThemeProvider>
    )
}

export default UserDashboard