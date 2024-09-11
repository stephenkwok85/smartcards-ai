import {loadStripe} from '@stripe/stripe-js'  // stripe-js is the frontend function

let stripePromise
// ensure we only create one instance of Stripe object, reusing it if it already exists
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    }
    return stripePromise;
}

export default getStripe
