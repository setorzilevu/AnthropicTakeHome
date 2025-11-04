# From Ideas to Outline: College Essay Brainstorming Tool

A conversational AI tool that guides students through brainstorming their college application essays. Using Claude AI, students select a Common App prompt and answer 7 thoughtful questions, receiving a comprehensive essay outline based on their authentic responses.

## Features

- **Prompt Selection**: Choose from 4 Common App essay prompts
- **Guided Conversation**: Answer 7 progressive questions designed to uncover your authentic story
- **Live Outline Generation**: Watch your essay outline develop in real-time as you answer questions
- **Comprehensive Outline**: Receive a detailed outline with:
  - High-level structure organized into logical sections
  - Explanation of why the structure works for your story
  - Suggestions on how to craft your narrative
  - Next steps for essay submission and review
- **Export Options**: Export your outline as text or markdown
- **Session Persistence**: Your progress is saved automatically

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **AI**: Anthropic Claude API
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + LocalStorage

## Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/setorzilevu/AnthropicTakeHome.git
cd AnthropicTakeHome
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

4. Start the backend server:
```bash
npm run dev
```

5. In a separate terminal, start the frontend development server:
```bash
npm run client
```

6. Open your browser to `http://localhost:3000`

## Architecture

### Backend (`src/server.ts`)

Express API server on port 3001 with the following endpoints:

- `GET /` - Health check endpoint
- `POST /api/chat` - Generate questions and process student responses
  - Generates contextual questions using Claude based on conversation state
  - Analyzes student responses for depth and specificity
  - Generates follow-up questions when needed
  - Manages conversation stage progression (Q1-Q7)
- `POST /api/generate-outline` - Generate comprehensive essay outline
  - Creates detailed outline based on entire conversation
  - Includes sections, explanation, and follow-up prompt

### Frontend (`src/client/`)

React + TypeScript application with the following structure:

#### Pages/Flow
1. **Landing Page** (`ArtifactsGallery`) - Artifacts-style gallery with "From Ideas to Outline" card
2. **Prompts Page** (`App.tsx`) - Display 4 Common App prompts with "How it Works" modal
3. **Brainstorm Page** (`TwoPanelBrainstorm`) - Two-panel interface:
   - Left: Questions and responses (7 questions total)
   - Right: Live outline generation
4. **Outline Page** (`App.tsx`) - Two-panel display of final outline:
   - Left: Outline structure
   - Right: Explanation and suggestions

#### Components

**Landing:**
- `ArtifactsGallery.tsx` - Landing page with artifact cards

**Prompts:**
- `HowItWorksModal.tsx` - Modal explaining the brainstorming process

**Brainstorm:**
- `TwoPanelBrainstorm.tsx` - Main brainstorming interface
- `LoadingState.tsx` - Loading indicator component

**Outline:**
- `OutlineSection.tsx` - Individual outline section display
- `ExportOptions.tsx` - Export outline as text/markdown
- `RefineModal.tsx` - Refine individual outline sections

**UI:**
- `Button.tsx` - Reusable button component
- `Card.tsx` - Reusable card component
- `Modal.tsx` - Reusable modal component
- `ProgressBar.tsx` - Progress indicator
- `TextArea.tsx` - Auto-growing textarea component

#### Hooks

- `useBrainstormSession.ts` - Manages brainstorming session state
  - Handles conversation state
  - Fetches questions from API
  - Submits responses and manages stage progression
  - Persists to localStorage
- `useLocalStorage.ts` - Generic localStorage hook

#### Libraries

- `claude.ts` - Claude API client functions
  - `generateQuestion()` - Generate contextual questions
  - `analyzeResponse()` - Analyze student responses
  - `generateFollowUp()` - Generate follow-up questions
  - `generateOutline()` - Generate comprehensive outline
- `systemPrompts.ts` - Centralized system prompts for Claude
- `prompts.ts` - Common App essay prompts data
- `types.ts` - TypeScript type definitions
- `utils.ts` - Utility functions (className merging)

## Question Flow

The tool guides students through 7 progressive questions:

1. **Q1_EXPLORATION** - Initial exploration of potential topics
2. **Q2_SELECTION** - Narrowing down to a specific topic
3. **Q3_SPECIFIC_MOMENT** - Identifying a specific moment or experience
4. **Q4_DILEMMA** - Exploring internal conflict or dilemma
5. **Q5_ACTION** - What actions were taken
6. **Q6_DISCOVERY** - What was discovered or learned
7. **Q7_FUTURE** - How this experience influences the future

Optional follow-up questions may be generated if responses need more depth.

## Outline Generation

After completing all questions, the tool generates a comprehensive outline including:

- **Sections**: 8 detailed sections (Opening Hook, Background Context, Core Experience, etc.)
- **Explanation**: Why the structure works for the student's specific story
- **Suggestions**: Guidance on crafting the narrative and the impact it will create
- **Follow-up Prompt**: Invitation to submit the essay for review once written

The outline emphasizes that it's a **skeleton outline** and the student is responsible for writing the actual essay.

## Design Principles

- **Claude UI Design**: Mimics Claude's clean, minimalist interface
- **Progressive Disclosure**: Outline builds progressively as questions are answered
- **Authentic Voice**: Preserves student's natural language and authentic responses
- **Student Agency**: Students write their own essay; the tool only provides structure
- **Non-Blocking UI**: API calls are non-blocking for responsive user experience

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Project Structure

```
src/
├── client/              # React frontend
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Client-side libraries
│   └── main.tsx        # Frontend entry point
└── server.ts           # Express backend server
```

## API Examples

### Generate Question

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "promptId": "challenge",
      "currentStage": "Q1_EXPLORATION",
      "messages": [],
      "studentResponses": {}
    }
  }'
```

### Submit Response

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "promptId": "challenge",
      "currentStage": "Q1_EXPLORATION",
      "messages": [],
      "studentResponses": {}
    },
    "userResponse": "I faced a challenge when I lost my job during the pandemic..."
  }'
```

### Generate Outline

```bash
curl -X POST http://localhost:3001/api/generate-outline \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "promptId": "challenge",
      "currentStage": "COMPLETE",
      "messages": [...],
      "studentResponses": {...}
    }
  }'
```

## Ethical Considerations

- **Student Agency**: The tool provides structure and guidance; students write their own essays
- **Transparency**: Clear messaging that the outline is a skeleton, not the essay itself
- **Authentic Voice**: Preserves student's natural language and doesn't over-polish responses
- **No Plagiarism**: All content originates from student responses

## License

ISC
