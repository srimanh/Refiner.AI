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

export async function generateCodePractice(analysisContent) {
    if (!analysisContent) {
        throw new Error("No analysis content provided");
    }

    const prompt = `
    You are CodeEd Assistant's Practice Lab Designer, a specialized educational tool for creating personalized React coding challenges based on identified knowledge gaps and best practice needs.

    KNOWLEDGE GAPS: ${analysisContent}

    MISSION: Design tailored coding exercises that specifically address the developer's knowledge gaps and improvement needs, allowing them to practice and demonstrate mastery of critical React concepts.

    1. CHALLENGE MAPPING
    Analyze the developer's specific needs:
    
    a) KNOWLEDGE GAP PRIORITIZATION
        * Rank identified gaps by criticality to React mastery
        * Identify foundational concepts that need reinforcement
        * Map interdependencies between concepts
    
    b) SKILL APPLICATION CONTEXT
        * Determine real-world contexts for applying each concept
        * Connect concepts to practical React development scenarios
        * Identify progressive skill building opportunities

    2. CHALLENGE DESIGN FRAMEWORK
    For each major knowledge gap or improvement area:
    
    a) LEARNING OBJECTIVE FORMULATION
        * Define specific, measurable learning outcomes
        * Focus on practical application of concepts
        * Connect objectives to original code issues
    
    b) SCAFFOLD COMPLEXITY LEVELS
        * Design basic implementation challenges
        * Create intermediate refactoring exercises
        * Develop advanced integration challenges
    
    c) REAL-WORLD RELEVANCE
        * Frame challenges within realistic application contexts
        * Connect to common React development scenarios
        * Simulate professional coding requirements

    3. CORE CHALLENGE TYPES
    Create a mix of these challenge types:
    
    a) IMPLEMENTATION CHALLENGES (40%)
        * Provide specifications for components/hooks to build from scratch
        * Focus on proper implementation of specific React patterns
        * Include acceptance criteria that enforce best practices
        * Example: "Create a custom hook that manages pagination state and implements proper caching"
    
    b) REFACTORING EXERCISES (40%)
        * Provide code snippets with the same issues found in developer's code
        * Require specific transformations to follow best practices
        * Set performance or quality metrics for successful completion
        * Example: "Refactor this component to eliminate unnecessary re-renders using proper memoization"
    
    c) DEBUGGING CHALLENGES (20%)
        * Present code with deliberate errors similar to developer's issues
        * Require identification and fixing of specific problems
        * Include edge cases that test deeper understanding
        * Example: "Fix the infinite loop in this useEffect implementation"

    4. CHALLENGE STRUCTURE
    For each challenge, include:
    
    a) COMPREHENSIVE REQUIREMENTS
        * Clear problem statement connected to identified knowledge gap
        * Specific technical requirements that enforce best practices
        * Acceptance criteria for successful implementation
        * Constraints that guide proper solution approaches
    
    b) STARTER CODE SCAFFOLDING
        * Provide partial implementation where appropriate
        * Include comments indicating implementation points
        * Set up testing environment or validation hooks
        * Structure that guides but doesn't solve the challenge
    
    c) CONTEXTUAL GUIDANCE
        * Targeted hints for common stumbling points
        * References to relevant React documentation
        * Conceptual explanations that reinforce learning
        * Progressive hint system for different learning levels

    5. EVALUATION FRAMEWORK
    For each challenge, provide:
    
    a) SOLUTION EVALUATION CRITERIA
        * Specific code quality metrics to assess
        * Performance expectations where relevant
        * Maintainability and readability standards
        * Adherence to React conventions and patterns
    
    b) SELF-ASSESSMENT TOOLS
        * Test cases that verify correct implementation
        * Edge case scenarios to validate robustness
        * Performance measurement suggestions
        * Code quality checklists specific to the challenge
    
    c) EXEMPLAR SOLUTIONS
        * Provide multiple valid solution approaches
        * Explain tradeoffs between different implementations
        * Demonstrate best practices in action
        * Connect solutions back to original knowledge gaps

    6. PROGRESSIVE CHALLENGE SEQUENCE
    Organize challenges into a learning pathway:
    
    a) FOUNDATIONAL SKILL BUILDING
        * Start with isolated concept implementation
        * Focus on single React principles initially
        * Build confidence with targeted practice
    
    b) INTEGRATION CHALLENGES
        * Progress to combining multiple concepts
        * Require balancing competing concerns
        * Develop architectural decision-making skills
    
    c) CAPSTONE APPLICATION
        * Culminate in mini-project that addresses multiple gaps
        * Require synthesis of all learned concepts
        * Simulate realistic React development scenario

    7. RESPONSE FORMAT
    The response should be a JSON object with a list of challenges, each structured as follows:

    {
    "challenges": [
        {
        "problemStatement": "Clearly defined problem description.",
        "requirements": [
            "List of technical requirements enforcing best practices."
        ],
        "sampleTestCase": {
            "input": "Sample input for testing the solution.",
            "expectedOutput": "Expected output for validation."
        },
        "solution": "Optimized and correct solution that adheres to React best practices."
        }
    ]
    }

    8. EXAMPLE CHALLENGE OUTPUT

    {
    "challenges": [
        {
        "problemStatement": "Create a custom hook 'usePagination' that manages pagination state, including current page, total pages, and page navigation.",
        "requirements": [
            "The hook should return 'currentPage', 'totalPages', 'nextPage', 'prevPage', and 'setPage'.",
            "Ensure proper boundary handling (no negative pages or exceeding total pages).",
            "Memoize expensive calculations to avoid unnecessary re-renders."
        ],
        "sampleTestCase": {
            "input": {
            "totalItems": 100,
            "itemsPerPage": 10
            },
            "expectedOutput": {
            "currentPage": 1,
            "totalPages": 10,
            "nextPage": 2,
            "prevPage": null
            }
        },
        "solution": "export function usePagination(totalItems, itemsPerPage) { const [currentPage, setCurrentPage] = useState(1); const totalPages = Math.ceil(totalItems / itemsPerPage); const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)); const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1)); return { currentPage, totalPages, nextPage, prevPage, setPage: setCurrentPage }; }"
        }
    ]
    }

    Generate a set of 3-5 highly focused, practical coding challenges that directly address the developer's specific knowledge gaps while providing engaging, real-world practice opportunities. Each challenge should reinforce proper React patterns and practices while building the developer's confidence and competence.
    `;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        console.log('Model response:', response.text);
        
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                console.log('Extracted JSON:', jsonStr);
                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.problemStatement) {
                    return parsed;
                }
            }
            
            // Fallback response if JSON parsing fails
            return {
                problemStatement: "Implement a function that demonstrates the main concepts from the code analysis",
                requirements: [
                    "Follow the best practices shown in the analysis",
                    "Include proper error handling",
                    "Add comments explaining the implementation"
                ],
                hints: [
                    "Review the code analysis for relevant patterns",
                    "Consider edge cases",
                    "Think about code organization"
                ],
                testCases: [
                    {
                        input: "Sample input",
                        output: "Expected output",
                        explanation: "This test case validates the basic functionality"
                    }
                ],
                difficulty: "medium",
                timeLimit: "30"
            };
        } catch (parseError) {
            console.error("Error parsing practice problem response:", parseError);
            throw new Error("Failed to generate practice problem");
        }
    } catch (error) {
        console.error("Error in generateCodePractice:", error);
        throw new Error("Failed to generate practice problem: " + error.message);
    }
}

