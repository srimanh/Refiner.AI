import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

// Load environment variables from .env file
// dotenv.config();
const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

const parser = new JsonOutputParser();

export async function analyzeCode(fileContent, fileName = 'untitled') {
    const safeContent = String(fileContent);

    const prompt = `
    You are CodeEd Assistant's Analysis Engine, a specialized educational tool that performs detailed code reviews of React applications to identify knowledge gaps.

    FILE: ${fileName}

    CODE:
    \`\`\`
    ${safeContent}
    \`\`\`

    MISSION: Identify with extreme precision where the code deviates from React best practices and determine the underlying conceptual knowledge gaps the developer likely has.

    1. INITIAL CODE COMPREHENSION
    - Parse the complete codebase to identify React components, hooks, patterns, and functionality
    - Determine the apparent purpose of the code and its intended functionality
    - Map the component hierarchy and data flow
    - Identify any external utilities or managers that handle specific functionality (e.g., socket managers, API clients, state managers)
    - DO NOT attribute responsibilities to the component that are handled by imported utilities or managers

    2. FUNDAMENTAL CONCEPT EVALUATION (Be exhaustively detailed)
    - Component Architecture
        * Assess component composition, reusability, and separation of concerns
        * Evaluate prop usage, typing, and validation practices
        * Identify misuse of prop drilling versus context/state management
    
    - State Management
        * Analyze state initialization, updates, and dependencies
        * Evaluate appropriateness of useState vs useReducer vs context
        * Detect anti-patterns in state handling (mutation, improper updates)
    
    - Side Effect Handling
        * Examine useEffect dependencies, cleanup functions, and conditional execution
        * Identify missed opportunities for custom hooks to abstract complex logic
        * Detect race conditions, infinite loops, and other effect-related bugs
        * Distinguish between local side effects and those handled by external managers
    
    - Rendering Optimization
        * Assess memoization usage (useMemo, useCallback, React.memo)
        * Identify costly re-renders and their root causes
        * Evaluate code splitting and lazy loading implementation
    
    - React Patterns
        * Detect inappropriate class components vs functional components
        * Evaluate HOC vs render props vs hooks implementations
        * Assess controlled vs uncontrolled component usage
        
    - Integration with External Services
        * Evaluate how the component interacts with external utilities (socket managers, API clients, etc.)
        * Assess whether the component correctly leverages external utilities' responsibilities
        * Focus on the component's usage of external services rather than the implementation of those services

    3. KNOWLEDGE GAP ANALYSIS
    For each issue identified, perform this multi-level analysis:
    
    a) ISSUE IDENTIFICATION
        * Pinpoint the exact line(s) of problematic code
        * Describe what makes this implementation suboptimal/incorrect
        * Verify that the issue is within the component's responsibility, not an external utility
    
    b) ROOT CAUSE ASSESSMENT
        * Determine what fundamental React concept is likely misunderstood
        * Rank severity: Critical (breaks app), Significant (impacts performance/maintainability), Minor (stylistic)
    
    c) CONCEPTUAL MAPPING
        * Link each issue to specific React concepts that need reinforcement
        * Create a knowledge graph showing relationships between misconceptions
    
    d) LEARNING OPPORTUNITY
        * Frame each issue as a specific learning moment with a focus on guided discovery
        * Provide an initial hint that directs attention to the problematic area without revealing the solution
        * Include documentation references that explain the relevant React principles
        * When appropriate, offer a progression of hints that gradually increase in specificity:
            - Level 1: Conceptual hint ("Consider how React handles component lifecycle here")
            - Level 2: Principle-focused hint ("Look at how useEffect dependencies affect re-renders")
            - Level 3: Implementation hint ("Review how your dependency array could be causing unnecessary re-renders")
        * Avoid complete "after" code solutions; instead, show small snippets demonstrating the correct pattern

    4. COMPREHENSIVE KNOWLEDGE GAP REPORT
    Synthesize your findings into a JSON object with the following structure:
    
    {
        "executiveSummary": "Brief overview of major knowledge gaps",
        "conceptMasteryAssessment": [
        {
            "concept": "Concept name",
            "score": 1-5,
            "evidence": "Brief evidence"
        }
        ],
        "detailedFindings": [
        {
            "issue": "Name of knowledge gap",
            "lineNumber":"Line number of the code example",
            "description": "Detailed description of the concept",
            "codeExample": "Code snippet showing misunderstanding",
            "initialHint": "First hint directing attention",
            "progressiveHints": [
            "Level 1 hint",
            "Level 2 hint",
            "Level 3 hint"
            ],
            "keyPrinciples": ["Principle 1", "Principle 2"],
            "impact": "Why understanding this matters",
            "documentationUrl": "Link to React docs"
        }
        ],
        "learningPriorityMatrix": {
        "highImpact": ["Issue 1", "Issue 2"],
        "mediumImpact": ["Issue 3"],
        "lowImpact": ["Issue 4"],
        "dependencies": "Description of learning dependencies"
        }
    }

    Be ruthlessly detailed in your analysis. Explain every issue with crystal clarity, citing specific lines of code and explaining exactly why they indicate a knowledge gap. Your ultimate goal is to create a learning roadmap that precisely identifies what concepts the developer needs to master.

    IMPORTANT: Before attributing responsibility for any functionality to the component, carefully check for imports of external managers, utilities, or services that may handle that functionality. For example, if the code imports a socket manager (e.g., 'import {getSocket} from "@/socket/socketManger"'), do not criticize the component for improper socket initialization or connection management, as that responsibility likely belongs to the imported utility.`;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);

        const parsedResponse = await parser.parse(response.text);
        
        return {
            analysis: parsedResponse
        };
    } catch (error) {
        console.error("Error in analyzeCode:", error);
        throw new Error("Failed to analyze code: " + error.message);
    }
}

