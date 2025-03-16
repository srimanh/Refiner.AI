import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

// Load environment variables from .env file
// dotenv.config();
// import.meta.env.
const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

const parser = new JsonOutputParser();

export async function generateQuiz(analysisContent) {
    if (!analysisContent) {
        throw new Error("No analysis content provided");
    }

    const prompt = `
    You are CodeEd Assistant's Assessment Engine, a specialized educational tool for creating personalized React knowledge quizzes based on code analysis.

    PREVIOUS ANALYSIS:${analysisContent}

    MISSION: Generate a comprehensive, personalized quiz that precisely targets the knowledge gaps identified in the code analysis to reinforce learning of React concepts.

    1. KNOWLEDGE GAP MAPPING
    Begin by extracting and categorizing all knowledge gaps from the previous analysis:
    
    a) For each identified gap:
        * Extract the specific React concept that needs reinforcement
        * Determine the severity/impact level (critical, significant, minor)
        * Map related concepts that build upon this knowledge
        * Identify the practical application context from the developer's code
    
    b) Create a structured knowledge map by:
        * Grouping related concepts hierarchically
        * Identifying foundational vs. advanced concepts
        * Prioritizing based on importance and impact
        * Connecting concepts to specific instances in the developer's code

    2. QUIZ DESIGN PRINCIPLES
    Construct the quiz following these educational design principles:
    
    a) SCAFFOLDED DIFFICULTY
        * Begin with concept recognition questions
        * Progress to application/analysis questions
        * Culminate with synthesis/evaluation questions
    
    b) PRACTICAL RELEVANCE
        * Use code contexts similar to the developer's actual code
        * Frame questions around real-world React scenarios
        * Include practical problems the developer will encounter
    
    c) COMPREHENSIVE COVERAGE
        * Ensure every identified knowledge gap is addressed
        * Provide multiple question types for critical concepts
        * Balance breadth and depth of concept assessment

    3. QUIZ STRUCTURE
    Create a quiz with these components:
    
    a) CONCEPT RECOGNITION (40%)
        * Multiple choice questions testing terminology understanding
        * True/false questions on React principles
        * Matching exercises for related concepts
        * Example: "Which hook would you use to perform side effects in a functional component?"
    
    b) CODE ANALYSIS (40%)
        * Code snippets with bugs to identify
        * Performance issue identification
        * Anti-pattern recognition
        * Example: "What is the problem with this useEffect implementation? [code snippet]"

        c) INTEGRATIVE THINKING (20%)
        * Ask about trade-offs, performance, and real-world best practices
        * Example: “How would you refactor this component for better reusability and maintainability?”
    

    4. QUIZ GENERATION
    For each identified knowledge gap, create questions that:
    
        a) CURRENT LEVEL ASSESSMENT

        Test depth of understanding with increasingly complex examples
        Identify boundaries where comprehension begins to break down
        Evaluate ability to explain core principles in their own words

        b) STRETCH CHALLENGES

        Present code examples deliberately beyond current comfort zone
        Require identification and resolution of non-obvious issues
        Demand explanation of solutions that demonstrate deeper understanding

        c) ADVANCED INTEGRATION

        Test ability to connect this concept with related advanced topics
        Challenge application in edge cases and unconventional scenarios
        Evaluate capacity to question, improve upon, and extend standard implementations

    5. QUIZ FORMATTING
    Format the quiz with these elements:
    
    a) CLEAR INSTRUCTIONS
        * Specify question format and expectations
        * Indicate point values based on concept importance
        * Provide any necessary context for code-based questions
    
    b) ORGANIZED SECTIONS
        * Group questions by concept area
        * Arrange from fundamental to advanced within each section
        * Provide clear section headers and learning objectives
    
    c) ANSWER KEY & EXPLANATIONS
        * Include detailed explanations for all answers
        * Reference React documentation and best practices
        * Connect answers back to the developer's original code issues
        
        Create a quiz in the following JSON format:
        {
            "quizzes": [
                {
                    "question": "Specific question about the code analysis",
                    "options": [
                        "First option",
                        "Second option",
                        "Third option",
                        "Fourth option"
                    ],
                    "correctAnswer": "The exact text of the correct option",
                    "explanation": "Explanation why this answer is correct"
                }
            ]
        }

    Generate a 10 question personalized quiz that precisely targets the developer's specific knowledge gaps while providing a comprehensive assessment of their React understanding. Each question must directly connect to issues identified in their code while teaching proper React concepts and practices.
    `;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.quizzes) {
                    return parsed;
                }
            }
            
            // If no valid JSON found, create a structured response
            return {
                quizzes: [{
                    question: "What is the main focus of this code analysis?",
                    options: [
                        "Code quality and best practices",
                        "Database optimization",
                        "Network security",
                        "UI design patterns"
                    ],
                    correctAnswer: "Code quality and best practices",
                    explanation: "The analysis primarily focuses on code quality, React best practices, and potential improvements."
                }]
            };
        } catch (parseError) {
            console.error("Error parsing quiz response:", parseError);
            throw new Error("Failed to generate quiz from analysis");
        }
    } catch (error) {
        console.error("Error in generateQuiz:", error);
        throw new Error("Failed to generate quiz: " + error.message);
    }
}

