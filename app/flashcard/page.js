'use client'

import {useUser} from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { collection, doc, getDoc, getDocs, deleteDoc, query, setDoc, updateDoc } from 'firebase/firestore'
import { writeBatch } from 'firebase/firestore'
import { useRouter, useSearchParams} from 'next/navigation';
import { db } from '@/firebase'
import Link from 'next/link'
import {SignedIn, SignedOut, UserButton} from "@clerk/nextjs";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ReactMarkdown from 'react-markdown'
import {AppBar, CircularProgress, Toolbar, IconButton, Box, Tooltip, Stack, Typography, Paper, TextField, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Grid} from '@mui/material'

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
import { grey, teal, blue, cyan, green, orange, pink, lightBlue, red} from '@mui/material/colors';

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

export default function Flashcard() {
    const { isLoaded, isSignedIn, user } = useUser();  // clerk authentication variables
    const [loading, setLoading] = useState(true);
    const [flashcards, setFlashcards] = useState([])
    const [flippedCard, setFlippedCard] = useState([])
    const [newName, setNewName] = useState('')
    const [open, setOpen] = useState(false)  // delete modal
    const [openEdit, setOpenEdit] = useState(false)  // edit modal

    const [activeButton, setActiveButton] = useState('library');

    const searchParams = useSearchParams()
    const search = searchParams.get('id')
    const router = useRouter()  // initialize useRouter

    useEffect(() => {
        if (isLoaded) {
            setLoading(false); // set loading to false until the user data is loaded
        }
    }, [isLoaded]);

    useEffect(() => {
        async function getFlashcard() {
            if (!search || !user) return
            const colRef = collection(doc(collection(db, 'users'), user.id), search)
            const docs = await getDocs(colRef)
            const flashcards = []

            docs.forEach((doc) => {
                flashcards.push({id: doc.id, ...doc.data()})
            })
            setFlashcards(flashcards)
        }
        getFlashcard()
    }, [user, search])

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    // opening and closing the modals (dialog)
    const handleOpen = () => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
    }

    const handleOpenEdit = () => {
        setOpenEdit(true)
    }

    const handleCloseEdit = () => {
        setOpenEdit(false)
    }


    const handleCardClick = (id) => {
        setFlippedCard((prev) => ({
            ...prev,
            [id]: !prev[id],      
        }))
    }

    const handleButtonClick = (buttonName) => {
        setActiveButton(buttonName);
      };

    const handleCollectionDelete = async (search) => {
        try {
            // reference to the user's document
            const userDocRef = doc(collection(db, 'users'), user.id)
            // fetch the user's document
            const userDocSnap = await getDoc(userDocRef)
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                const collections = data.flashcards || []
                // remove the collection name from the flashcards array
                const updatedCollections = collections.filter(flashcard => flashcard.name !== search);
                // create a batch to perform multiple operations
                const batch = writeBatch(db);
                // reference to collection to be deleted
                const colRef = collection(userDocRef, search);
                // fetch all the documents in the collection
                const colDocs = await getDocs(colRef);
                // loop through each document and delete
                await Promise.all(
                    colDocs.docs.map(docSnap => deleteDoc(doc(colRef, docSnap.id)))  // transform e/ document snapshot into a promise by calling deleteDoc
                );  // once all docs in a collection are deleted, firestore removes the collection
                // update the flashcards array in the user's document
                batch.set(userDocRef, { flashcards: updatedCollections }, { merge: true });
                // commit the batch
                await batch.commit();
                // redirect to the parent page after successful deletion
                router.push('/flashcards')
            } else {
                console.error('User document does not exist.');
            }
        } catch (error) {
            console.error("Error deleting collection", error)
        }
    }

    // edit collection: create new collection with desired name, copying the documents from the old collection to the new one, and then deleting the old collection
    const handleCollectionEdit = async (oldName, newName) => {
        try {
            // reference to the user's document
            const userDocRef = doc(collection(db, 'users'), user.id);
            // fetch the user's document
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                const collections = data.flashcards || [];
                // check if the new name already exists
                if (collections.some(flashcard => flashcard.name === newName)) {
                    console.error('A collection with the new name already exists.');
                    return;
                }
                // create a batch to perform multiple operations
                const batch = writeBatch(db);
                // reference to old and new collections
                const oldColRef = collection(userDocRef, oldName);
                const newColRef = collection(userDocRef, newName);
                // fetch all documents in the old collection
                const oldColDocs = await getDocs(oldColRef);
    
                // copy each document from the old collection to the new one
                await Promise.all(
                    oldColDocs.docs.map(docSnap => {
                        const docData = docSnap.data();
                        return setDoc(doc(newColRef, docSnap.id), docData);  // copy the document
                    })
                );
                // delete old documents after they have been copied
                await Promise.all(
                    oldColDocs.docs.map(docSnap => deleteDoc(doc(oldColRef, docSnap.id)))
                );
                // remove the old collection name and add the new one in the flashcards array
                const updatedCollections = collections.map(flashcard => 
                    flashcard.name === oldName ? { ...flashcard, name: newName } : flashcard
                );
                // update the flashcards array in the user's document
                batch.set(userDocRef, { flashcards: updatedCollections }, { merge: true });
                // commit the batch
                await batch.commit();
                // redirect to the newly named collection page after successful renaming
                router.push(`/flashcard?id=${newName}`);
                // close edit modal
                setOpenEdit(false)
            } else {
                console.error('User document does not exist.');
            }
        } catch (error) {
            console.error("Error renaming collection", error);
        }
    };
    

    if (!isLoaded || !isSignedIn) {
        return <></>
    }

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{width: '100%'}}
            >
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
                            <IconButton aria-label="home" size="large" color="primary" href="/userDashboard">
                            <HomeIcon fontSize="inherit" />
                            </IconButton>
                        </CustomTooltip>
                        </ListItem>
                        <ListItem disablePadding>
                        <CustomTooltip title="Your Sets" placement="right">
                            <IconButton aria-label="library" size="large" color="primary" href="/flashcards" onClick={() => handleButtonClick('library')}
                            sx={{
                                backgroundColor: activeButton === 'library' ? teal[100] : 'transparent',
                                '&:hover': {
                                backgroundColor: activeButton === 'library' ? teal[100] : theme.palette.action.hover,
                                },
                            }}>
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

                {/* flashcard content */}
                <Box
                    sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", pt: 14, pl: 14, pr: 6}}
                    height="100vh"
                >
                    <Box display="flex" justifyContent="space-between" sx={{width: "100%", pb: 4, pr: 1}}>
                        <Typography variant="h4" sx={{fontWeight: 'bold'}}>{search}</Typography>
                        <Stack direction="row" spacing={1}>
                            <IconButton 
                                aria-label="edit name" 
                                onClick={handleOpenEdit}
                                sx={{color: teal[500]}}
                            >
                                <EditOutlinedIcon/>
                            </IconButton>
                            <IconButton 
                                aria-label="delete" 
                                onClick={handleOpen}
                                sx={{color: red[600]}}
                            >
                                <DeleteOutlineIcon/>
                            </IconButton>
                        </Stack>
                        
                    </Box>
                    <Divider sx={{ width: "100%", mx: "auto", borderColor: teal[500] }} />
                    <Box sx={{ width: "100%", pt: 4, pb: 8}}>
                            <Grid container spacing={3} sx={{ mt: 0}}>
                                {flashcards.map((flashcard, index) => {
                                    return (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key = {index}>
                                        <Card sx={{borderRadius: "10px"}}>
                                            <CardActionArea onClick={() => handleCardClick(index)}>
                                                <CardContent>
                                                    <Box sx={{
                                                        perspective: "1000px",
                                                        '& > div': {
                                                                transformStyle: "preserve-3d",
                                                                transition: "transform 0.6s",
                                                                position: "relative",
                                                                width: "100%",
                                                                height: "250px",
                                                                borderRadius: "10px",
                                                                boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
                                                                transform: flippedCard[index] 
                                                                    ? 'rotateY(180deg)' 
                                                                    : "rotateY(0deg)",
                                                            },
                                                            '& > div > div': {
                                                                position: "absolute",
                                                                width: "100%",
                                                                height: "100%",
                                                                backfaceVisibility: "hidden",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                padding: 2,
                                                                boxSizing: "border-box",
                                                  
                                                                maxHeight: "100%", // ensure content doesn't exceed the container
                                                            }, 
                                                            '& > div > div > div': {
                                                                overflow: "auto", // add scrolling to the text container itself
                                                                maxHeight: "100%", // ensure text doesn't exceed container
                                                                padding: '8px', 
                                                            },
                                                            '& > div > div:nth-of-type(2)': {
                                                                transform: 'rotateY(180deg)'
                                                            }
                                                    }}>
                                                        <div style={{ textAlign: 'center'}}>
                                                            <div>
                                                                <Typography variant = "h6" component = "div">
                                                                    <ReactMarkdown>{flashcard.front}</ReactMarkdown>
                                                                </Typography>
                                                            </div>
                                                            <div>
                                                                <Typography variant = "h6" component = "div">
                                                                    <ReactMarkdown>{flashcard.back}</ReactMarkdown>
                                                                </Typography>
                                                            </div>
                                                        </div>
                                                    </Box>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                    )
                                })}
                            </Grid>
                    </Box>
                </Box>
                {/* delete modal */}
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Delete Flashcard Set</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this set? It will be lost forever.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={() => handleCollectionDelete(search)}>Delete</Button>
                    </DialogActions>
                </Dialog>
                 {/* edit modal */}
                 <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth={true}>
                    <DialogTitle>
                        <Typography  
                            variant="h6" 
                            component="div" 
                            fontWeight="bold"
                        >
                            Edit Set Name
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            <TextField 
                                id="outlined-basic" 
                                label="New Collection Name" 
                                variant="outlined" 
                                value = {newName} 
                                onChange = {(e) => setNewName(e.target.value)}
                                fullWidth
                                sx={{mt:1}}
                            />
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEdit}>Cancel</Button>
                        <Button onClick={() => handleCollectionEdit(search, newName)}>Edit</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    )
}