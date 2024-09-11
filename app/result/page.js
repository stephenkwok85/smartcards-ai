'use client'

import {useUser} from '@clerk/nextjs'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import getStripe from '@/utils/get-stripe'
import { useSearchParams } from 'next/navigation'
import { Typography, Button } from '@mui/material'
import { Box, CircularProgress } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { grey, teal, blue, cyan, green, orange, pink, lightBlue, red} from '@mui/material/colors';

// theme imports
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

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

const ResultPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const session_id = searchParams.get('session_id')
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => { 
        const fetchCheckoutSession = async () => {
            if (!session_id) return

            try {
                const res = await fetch(`/api/checkout_session?session_id=${session_id}`)
                const sessionData = await res.json()
                if (res.ok) {
                    setSession(sessionData)
                } else {
                    setError(sessionData.error)
                }
            }
            catch (err) {
                console.log(err)
                setError("An error occured")
            }
            finally {
                setLoading(false)
            }
        }
        fetchCheckoutSession()
        }, [session_id]
    )
    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <Box
                    sx={{width: '100%', textAlign: 'center', display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh"}}>   
                    <CircularProgress sx={{my: 2}} />
                    <Typography variant ="h6">Loading...</Typography>
                </Box>
            </ThemeProvider>
        )
    }

    if (error) {
        return (
            <Box
                sx={{width: '100%', textAlign: 'center', mt: 4}}>   
                <Typography variant ="h6">{error}</Typography>
            </Box>
        )
    }

    return (
        <Box
            sx={{width: '100%', textAlign: 'center'}}>   
            {session.payment_status === 'paid' 
            ? (
                <>
                    <ThemeProvider theme={theme}>
                        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
                            <Box sx={{mb: 2}}>
                                <CheckCircleIcon sx={{ fontSize: 80, color: green[600]}}/>
                            </Box>
                            <Typography variant ="h4" sx={{mb: 4}}>Thank you for subscribing!</Typography>
                            <Box>
                                <Typography variant = "h6" sx={{mb: 2}}>Session ID: {session_id}</Typography>
                                <Typography variant = "body1">We have received your payment. You will receive an email confirmation with your order details shortly.</Typography>
                            </Box>
                            <Button variant="contained" color="primary" sx={{mt:2, p: 2, px: 3}} href="/sign-in">Start Studying</Button>
                        </Box>
                    </ThemeProvider>
                </>
            ) : (
                <>
                    <ThemeProvider theme={theme}>
                        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
                            <Box sx={{mb: 2}}>
                                <ErrorIcon sx={{ fontSize: 80, color: red[600]}}/>
                            </Box>
                            <Typography variant ="h4" sx={{mb: 2}}>Payment Failed</Typography>
                            <Box>
                                <Typography variant = "body1">Your payment was not successful. Please try again later.</Typography>
                            </Box>
                        </Box>
                    </ThemeProvider>
                </>
            )}
        </Box>
    )
}

export default ResultPage