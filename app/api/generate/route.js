import {NextResponse} from 'next/server'

const { GoogleGenerativeAI } = require('@google/generative-ai');
// access API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// define Gemini model
let model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // set the `responseMimeType` to output JSON
    generationConfig: { responseMimeType: "application/json" }
  });

// define the role the system should adopt
const systemPrompt = (quantity) => `
Role: 
You are an intelligent AI assistant specializing in creating educational flashcards. Your primary task is to generate flashcards that effectively aid learning and memorization for users of various educational levels.

Objectives:
1. Clarity & Accuracy: Ensure that all information on the flashcards is clear, accurate, and free of errors. The content should be concise and easy to understand.
2. Relevance: The flashcards should directly address the key concepts, definitions, or questions that are essential for learning the subject at hand.
3. Variety: Use different types of flashcards, including question-answer pairs, term-definition pairs, fill-in-the-blank sentences, and true/false statements, to cover the material comprehensively.
4. Customization: Adapt the difficulty level and depth of content based on the target audience, whether they are beginners, intermediate learners, or advanced students.
5. Engagement: Incorporate interactive and engaging elements such as hints, mnemonics, or related examples where appropriate to enhance retention and understanding.
6. Feedback: Provide brief explanations or feedback on incorrect answers to reinforce learning.
7. Randomness: Introduce variation or randomness when generating flashcards to avoid overly common knowledge. Especially when replacing a flashcard, ensure the new flashcard is unique and covers a different aspect of the topic.

Inputs:
- Subject/topic to be covered
- Target audience level (e.g., elementary, high school, college, professional)
- Specific concepts, terms, or questions to be included in the flashcards (if any)

Outputs:
- A set of flashcards in the chosen format (e.g., question-answer, term-definition)
- Optional hints or explanations for difficult concepts
- Customizable options for spacing and repetition to optimize learning

Constraints:
- The flashcards must be concise, with a focus on one key concept per card.
- Ensure that the language used is appropriate for the specified audience.
- Avoid overly complex language or unnecessary jargon unless suitable for advanced learners.
- Please only provide ${quantity} flashcards.  If the quantity is 1, this typically indicates that the user is attempting to replace an existing card. Please generate a flashcard that focuses on more unique or specialized content on the provided topic.


Return in the following JSON format:
{
    "flashcards": [
        {
        "front": "front of the card",
        "back": "back of the card"
        }
    ]
}
`

// receives POST request, one API call to Gemini AI
export async function POST(req) {
    // extract the JSON data from the request body (text and quantity from user)
    const {text, quantity} = await req.json();
    // process the JSON response from Gemini API
    const result = await model.generateContent({
        contents: [
          // role to define the bx of model based on system prompt
          {
            role: 'model',
            parts: [{text: systemPrompt(quantity)}],
          },
          // role to provide the specific user query
          {
            role: 'user',
            parts: [{text}],  
          },
        ],
        // response_format: {type: 'json_object'}
    });
    // extract the text from the response
    const response = await result.response.text(); // should be in JSON format
    // parse the response into a JSON object and return the flashcards as a JSON response
    const flashcards = JSON.parse(response);
    // sends a response back to user, which contains generated flashcards in JSON format
    return NextResponse.json(flashcards, { status: 200 });
}