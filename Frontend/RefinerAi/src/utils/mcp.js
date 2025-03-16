// src/utils/mcp.js

class ModelContextProtocol {
    constructor() {
      this.globalContext = {
        // Default global context that applies to all functions
        systemInstructions: "You are CodeEd Assistant, an educational code improvement tool designed specifically for React developers. Your goal is to analyze React code and provide helpful, educational feedback that helps developers improve their skills.",
        appName: "RefinedAI",
        maxOutputLength: 10000,
      };
      
      this.functionContexts = {
        // Function-specific contexts
        analyzeCode: {
          role: "CodeEd Assistant's Analysis Engine",
          objective: "Identify with extreme precision where the code deviates from React best practices and determine the underlying conceptual knowledge gaps the developer likely has.",
          outputFormat: `{
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
    `,
          examples: `{
  "executive_summary": "The Chat.jsx component reveals several key knowledge gaps in React fundamentals and best practices. The developer shows inconsistent understanding of useEffect, dependency arrays, state management, and component organization. While some aspects of React are implemented correctly, there are significant opportunities for improvement in effect cleanup, state initialization, and optimization.",
  "concept_mastery_assessment": {
    "Component Architecture": {
      "rating": 2,
      "comments": [
        "Good use of functional components but poor separation of concerns",
        "Missing prop validation entirely"
      ]
    },
    "State Management": {
      "rating": 3,
      "comments": [
        "Appropriate use of useState for local state",
        "Over-reliance on local state where derived state would be more appropriate",
        "No use of useReducer for complex state logic"
      ]
    },
    "Side Effect Handling": {
      "rating": 2,
      "comments": [
        "Significant issues with useEffect dependencies and organization",
        "Some cleanup implementation but incomplete"
      ]
    },
    "Rendering Optimization": {
      "rating": 1,
      "comments": [
        "No use of memoization (useMemo, useCallback)",
        "No prevention of unnecessary re-renders"
      ]
    },
    "React Patterns": {
      "rating": 2,
      "comments": [
        "Proper use of functional components",
        "Missing custom hooks for logic abstraction"
      ]
    }
  },
  "detailed_findings": [
    {
      "title": "Monolithic useEffect with Multiple Responsibilities",
      "concept": "Effect Separation and Single Responsibility Principle",
      "evidence": "Lines 72-105 contain a single useEffect handling multiple concerns.",
      "learning_opportunity": {
        "initial_hint": "Consider how React's useEffect is designed to group related side effects.",
        "react_principles": "Effects should be separated by concern for maintainability, readability, and proper execution.",
        "documentation": "https://react.dev/reference/react/useEffect#separating-unrelated-logic-into-different-effects"
      }
    },
    {
      "title": "Incomplete Dependency Array",
      "concept": "useEffect Dependencies",
      "evidence": "Line 105 has an incomplete dependency array, missing socket and data.",
      "learning_opportunity": {
        "initial_hint": "What variables from your component scope are used inside the effect but not listed in the dependency array?",
        "react_principles": "Effects should include all values from the component scope that change over time and are used inside the effect.",
        "documentation": "https://react.dev/reference/react/useEffect#specifying-dependencies"
      }
    },
    {
      "title": "Conditional Socket Event Setup",
      "concept": "Consistent Event Handling",
      "evidence": "Lines 89-97 setup socket events conditionally, which can lead to missed events or duplicates.",
      "learning_opportunity": {
        "initial_hint": "What happens when the socket becomes available after the component mounts?",
        "react_principles": "Event subscriptions should be set up consistently and cleaned up properly.",
        "documentation": "https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed"
      }
    },
    {
      "title": "State Derived from Props",
      "concept": "Derived State vs. Props",
      "evidence": "Line 20 initializes state from props, leading to potential synchronization issues.",
      "learning_opportunity": {
        "initial_hint": "What happens if the URL parameter id changes after the component mounts?",
        "react_principles": "Avoid duplicating props in state when possible to prevent synchronization issues.",
        "documentation": "https://react.dev/learn/thinking-in-react#step-3-find-the-minimal-but-complete-representation-of-ui-state"
      }
    },
    {
      "title": "Missing Custom Hooks for Logic Abstraction",
      "concept": "Custom Hooks for Reusable Logic",
      "evidence": "The component contains complex logic for fetching messages, socket event handling, and user searching.",
      "learning_opportunity": {
        "initial_hint": "What parts of this component's logic might be reused in other components?",
        "react_principles": "Custom hooks allow for sharing stateful logic between components.",
        "documentation": "https://react.dev/learn/reusing-logic-with-custom-hooks"
      }
    },
    {
      "title": "Inefficient Data Filtering",
      "concept": "Computed Values and Memoization",
      "evidence": "Data filtering runs on every render instead of being memoized.",
      "learning_opportunity": {
        "initial_hint": "What happens to performance when this filtering operation runs on every render?",
        "react_principles": "Expensive calculations should be memoized to prevent unnecessary recalculation.",
        "documentation": "https://react.dev/reference/react/useMemo"
      }
    },
    {
      "title": "Socket Cleanup Issues",
      "concept": "Effect Cleanup for Event Listeners",
      "evidence": "Socket event handlers are not fully removed during cleanup.",
      "learning_opportunity": {
        "initial_hint": "What happens to your socket event handlers when the component unmounts or dependencies change?",
        "react_principles": "Every subscription set up in an effect should be cleaned up to prevent memory leaks.",
        "documentation": "https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed"
      }
    },
    {
      "title": "Direct DOM Manipulations via classNames",
      "concept": "Declarative vs. Imperative Updates",
      "evidence": "Class names are conditionally applied instead of using conditional rendering.",
      "learning_opportunity": {
        "initial_hint": "Consider how React's declarative approach differs from directly manipulating element visibility.",
        "react_principles": "React favors conditional rendering over direct DOM manipulation.",
        "documentation": "https://react.dev/learn/conditional-rendering"
      }
    }
  ],
  "learning_priority_matrix": {
    "High Impact, Fundamental Concepts (Learn First)": [
      "useEffect Dependency Management",
      "Custom Hooks for Logic Extraction",
      "Effect Cleanup"
    ],
    "Medium Impact, Enhancing Concepts (Learn Next)": [
      "Derived State vs. Props",
      "Memoization with useMemo/useCallback",
      "Conditional Rendering vs. CSS Classes"
    ],
    "Lower Impact, Advanced Concepts (Learn Later)": [
      "Component Structure Optimization",
      "PropTypes/TypeScript for Type Safety"
    ]
  }
}
` // You can add example inputs/outputs here
        },
        practiceCode: {
          role: "CodeEd Assistant's Practice Lab Designer",
          objective: "Design tailored coding exercises that specifically address the developer's knowledge gaps and improvement needs, allowing them to practice and demonstrate mastery of critical React concepts",
          outputFormat: `{
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
    }`,
          example: `    {
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
    }`
        },
        resultCode: {
          role: "code evaluator",
          objective: "Design tailored coding exercises that specifically address the developer's knowledge gaps and improvement needs, allowing them to practice and demonstrate mastery of critical React concepts",
          outputFormat: `Please provide a detailed analysis in the following format:

            1. Test Cases Summary:
            - Number of test cases passed
            - Number of test cases failed
            - Overall pass rate

            2. Code Analysis:
            - Correctness of the solution
            - Time complexity
            - Space complexity
            - Code quality and readability

            3. Detailed Feedback:
            - What works well
            - Areas for improvement
            - Suggestions for optimization

            4. Final Verdict:
            - Whether the solution fully meets the requirements
            - Any edge cases that might not be handled
       - Recommendations for further improvements`,
          example: ``
        },
        quizGenerator: {
            role: "CodeEd Assistant's Assessment Engine",
            objective: "Generate a comprehensive, personalized quiz that precisely targets the knowledge gaps identified in the code analysis to reinforce learning of React concepts.",
            outputFormat: `        {
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
        }`,
        example: `{
        "quizzes": [
            {
            "question": "What is the primary issue with this useEffect implementation?",
            "options": [
                "The effect runs on every render",
                "The dependency array is incomplete, missing 'socket' and 'data' variables",
                "The effect doesn't return a cleanup function",
                "The effect is defined inside a conditional statement"
            ],
            "correctAnswer": "The dependency array is incomplete, missing 'socket' and 'data' variables",
            "explanation": "When variables from component scope (like 'socket' and 'data') are used inside an effect but not listed in the dependency array, it creates a stale closure issue. The effect won't re-run when these values change, leading to bugs where the effect uses outdated values. React's exhaustive-deps ESLint rule would flag this issue."
            },
            {
            "question": "What is the recommended approach for handling multiple unrelated side effects in a React component?",
            "options": [
                "Combine all logic into a single useEffect for better performance",
                "Separate unrelated logic into different useEffect hooks",
                "Use useLayoutEffect instead of useEffect for multiple side effects",
                "Create class components instead of functional components for complex effects"
            ],
            "correctAnswer": "Separate unrelated logic into different useEffect hooks",
            "explanation": "Following the Single Responsibility Principle, each useEffect should handle one concern. This improves maintainability, readability, and ensures proper execution timing. The code analysis identified a monolithic useEffect (lines 72-105) handling multiple concerns, which should be separated into multiple, focused effects."
            },
            {
            "question": "Examine this code snippet:\n'jsx\nconst [chatId, setChatId] = useState(id);\n'\nWhat is the potential issue with initializing state from a prop as shown above?",
            "options": [
                "It causes unnecessary re-renders",
                "useState doesn't accept variables as initial values",
                "The state won't stay synchronized if the 'id' prop changes",
                "This pattern increases memory usage"
            ],
            "correctAnswer": "The state won't stay synchronized if the 'id' prop changes",
            "explanation": "When state is initialized from props like this, it only happens during the initial render. If the 'id' prop changes later, 'chatId' state won't automatically update to reflect the new value. This creates a synchronization issue between props and state. Instead, either use the prop directly or implement a useEffect to update the state when the prop changes."
            },
            {
            "question": "What's the correct way to clean up socket event listeners in a useEffect?",
            "options": [
                "Socket event listeners are automatically cleaned up by React",
                "Call socket.disconnect() in the component's onUnmount method",
                "Return a cleanup function from useEffect that removes the specific event listeners",
                "Set the socket variable to null when component unmounts"
            ],
            "correctAnswer": "Return a cleanup function from useEffect that removes the specific event listeners",
            "explanation": "To prevent memory leaks, every subscription (including socket event listeners) set up in an effect should be cleaned up. The proper pattern is to return a cleanup function from useEffect that removes the specific event listeners that were added. The analysis found incomplete socket cleanup, which could lead to memory leaks and bugs from dangling event handlers."
            },
            {
            "question": "Which approach is most effective for handling expensive data filtering operations in React components?",
            "options": [
                "Move filtering to a separate component",
                "Use useMemo to memoize the filtered results",
                "Perform filtering inside a useEffect",
                "Filter data only when a button is clicked"
            ],
            "correctAnswer": "Use useMemo to memoize the filtered results",
            "explanation": "When working with expensive calculations like data filtering, useMemo helps prevent unnecessary recalculations on every render. The memoized value will only be recalculated when the dependencies change. The code analysis found that data filtering runs on every render instead of being memoized, which can lead to performance issues, especially with larger datasets."
            }
        ]
        }`

        }
        // Add more function contexts as needed
      };
      
      this.prompts = {
        // Centralized prompt templates
        analyzeCode: this.buildPrompt(`
          You are a {{role}}. a specialized educational tool that performs detailed code reviews of React applications to identify knowledge gaps.
          
          CODE:
          \`\`\`
          {{code}}
          \`\`\`
          
        MISSION: {{objective}}

        1. INITIAL CODE COMPREHENSION
            - Parse the complete codebase to identify React components, hooks, patterns, and functionality
            - Determine the apparent purpose of the code and its intended functionality
            - Map the component hierarchy and data flow
            - Identify any external utilities or managers that handle specific functionality (e.g., socket managers, API clients, state managers)
            - DO NOT attribute responsibilities to the component that are handled by imported utilities or managers

            2. FUNDAMENTAL CONCEPT EVALUATION (Be exhaustively detailed)

            IMPORTANT: By default consider the given concepts and add anything else if needed.

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
            
            - Naming Conventions
              * Evaluate consistency and clarity of component, prop, state, and function names
              * Assess adherence to established React naming practices (PascalCase for components, camelCase for variables/functions)
              * Identify naming that fails to communicate purpose, intent, or relationship between elements
              * Examine prefix/suffix usage for related component families or specialized functions
                
              
            Consider the following code quality guidelines as well:
            1. DRY principle (Don't repeat yourself)
            2. Break code into small, focused files (Component-ization)
            3. Organize CSS files together
            4. Avoid inline CSS (create classes for 2+ CSS properties)
            5. Use linters for consistent code
            6. Review before pull requests
            7. Small functions with single responsibilities
            8. Create utility files to remove duplicate code
            9. Separate service calls (module_name.service.js)
            10. Logical file naming
            11. Self-commenting code (good variable/function names)
            12. Write test cases
            13. Destructure props for cleaner code
            14. Use useReducer for complex state
            15. Organize imports in this order:
                a. React imports
                b. Library imports (alphabetical)
                c. Absolute project imports (alphabetical)
                d. Relative imports (alphabetical)
                e. Import * as
                f. Import file extensions
            16. Use index.js for exports


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
            {{outputFormat}}

            Here is an example:
            {{example}}

            Be ruthlessly detailed in your analysis. Explain every issue with crystal clarity, citing specific lines of code and explaining exactly why they indicate a knowledge gap. Your ultimate goal is to create a learning roadmap that precisely identifies what concepts the developer needs to master.

            IMPORTANT: Before attributing responsibility for any functionality to the component, carefully check for imports of external managers, utilities, or services that may handle that functionality. For example, if the code imports a socket manager (e.g., 'import {getSocket} from "@/socket/socketManger"'), do not criticize the component for improper socket initialization or connection management, as that responsibility likely belongs to the imported utility.
          
            Keep your response under {{maxOutputLength}} characters.
        `),
        
        generateQuiz: this.buildPrompt(`
          You are a {{role}}, a specialized educational tool for creating personalized React knowledge quizzes based on code analysis.
          
          PREVIOUS ANALYSIS:
          {{analysisContent}}
          \`\`\`

          MISSION: {{objective}}
          
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
        {{outputFormat}}

        Here is an example:
        {{example}}

        Generate a 10 question personalized quiz that precisely targets the developer's specific knowledge gaps while providing a comprehensive assessment of their React understanding. Each question must directly connect to issues identified in their code while teaching proper React concepts and practices.
        `),
        
        resultCode: this.buildPrompt(`
          You are a {{role}}. Analyze the provided code solution against the problem statement.
          
          PROBLEM STATEMENT:
          {{problemStatement}}
          
          USER'S SOLUTION:
          \`\`\`
          {{code}}
          \`\`\`
          
          Please provide a detailed analysis in the following format:
          
          1. Test Cases Summary:
             - Number of test cases passed
             - Number of test cases failed
             - Overall pass rate
          
          2. Code Analysis:
             - Correctness of the solution
             - Time complexity
             - Space complexity
             - Code quality and readability
          
          3. Detailed Feedback:
             - What works well
             - Areas for improvement
             - Suggestions for optimization
          
          4. Final Verdict:
             - Whether the solution fully meets the requirements
             - Any edge cases that might not be handled
             - Recommendations for further improvements
          
          Please be specific and constructive in your feedback.
        `),
        
        
        practiceCode: this.buildPrompt(`
                You are {{role}}, a specialized educational tool for creating personalized React coding challenges based on identified knowledge gaps and best practice needs.

    KNOWLEDGE GAPS: {{analysisContent}}

    MISSION: {{objective}}

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

    {{response}}

    8. EXAMPLE CHALLENGE OUTPUT

    {{example}}

    Generate a set of 3-5 highly focused, practical coding challenges that directly address the developer's specific knowledge gaps while providing engaging, real-world practice opportunities. Each challenge should reinforce proper React patterns and practices while building the developer's confidence and competence.
            `)
      };
    }
    
    buildPrompt(template) {
      // Returns a function that fills in template variables
      return (variables) => {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
          result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
      };
    }
    
    getPrompt(functionName, variables) {
      // Get the appropriate prompt function
      const promptTemplate = this.prompts[functionName];
      if (!promptTemplate) {
        throw new Error(`No prompt template found for function: ${functionName}`);
      }
      
      // Merge global context, function context, and variables
      const mergedVars = {
        ...this.globalContext,
        ...this.functionContexts[functionName],
        ...variables
      };
      
      return promptTemplate(mergedVars);
    }
    
    // Utility method to update contexts
    updateGlobalContext(newContext) {
      this.globalContext = { ...this.globalContext, ...newContext };
    }
    
    updateFunctionContext(functionName, newContext) {
      if (!this.functionContexts[functionName]) {
        this.functionContexts[functionName] = {};
      }
      this.functionContexts[functionName] = { 
        ...this.functionContexts[functionName], 
        ...newContext 
      };
    }
  }
  
  // Create and export a singleton instance
  const mcp = new ModelContextProtocol();
  export default mcp;