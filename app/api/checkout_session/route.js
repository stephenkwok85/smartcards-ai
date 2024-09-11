import {NextResponse} from 'next/server'
import Stripe from 'stripe'

// initialize stripe object with secret api key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// method to convert dollar amount to cents (stripe api takes cent values)
const formatAmountForStripe = (amount) => {
    return Math.round(amount*100)
}

export async function POST(req) {
    try {
        // create checkout sessions from body params
        // define params object which includes all necessary info fro creating a stripe checkout session
        const params = {
            mode: 'subscription',  // for recurring payments
            payment_method_types: ['card'],  // accepting card payments only
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: 'Pro subscription',
                  },
                  unit_amount: formatAmountForStripe(10), // $10.00 in cents
                  recurring: {
                    interval: 'year',
                    interval_count: 1,
                  },
                },
                quantity: 1,
              },
            ],
            // set success and cancel URLs, which the user will be redirected to after payment process
            success_url: `${req.headers.get(
              'Referer',
            )}result?session_id={CHECKOUT_SESSION_ID}`,  // result is the folder that contains frontend
            cancel_url: `${req.headers.get(
              'Referer',
            )}result?session_id={CHECKOUT_SESSION_ID}`,  // result is the folder that contains frontend
        }
          // create the sesssion with given params
          const checkoutSession = await stripe.checkout.sessions.create(params)
          // return session as a JSON object back to user with 200 status code --> success
          return NextResponse.json(checkoutSession, {
            status: 200,
          })
    } catch (error) {
        console.error('Error creating checkout session:', error)
        return new NextResponse(JSON.stringify({ error: { message: error.message } }), {
            status: 500,
        })
    }
}

export async function GET(req) {
    const searchParams = req.nextUrl.searchParams
    // extract the session_id from query parameters of the request
    const session_id = searchParams.get('session_id')
  
    try {
      // no session_id is provided
      if (!session_id) {
        throw new Error('Session ID is required')
      }
      // retrieve the checkout session details by its ID
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
      // return session as a JSON object back to user
      return NextResponse.json(checkoutSession)
    } catch (error) {
      console.error('Error retrieving checkout session:', error)
      return NextResponse.json({ error: { message: error.message } }, { status: 500 })
    }
  }