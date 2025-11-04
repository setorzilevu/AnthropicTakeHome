# College Coach - Essay Mastery Application

A progressive learning system that teaches students to master college application essays through four skill levels: Clarity, Specificity, Reflection, and Voice.

## Features

- **4-Level Progression System**: Students progress through Clarity → Specificity → Reflection → Voice
- **85% Mastery Threshold**: Must demonstrate 85% mastery (4.25/5) before unlocking the next level
- **Level-Specific Coaching**: Claude provides tailored guidance for each skill level
- **Socratic Questioning**: Guided reflection through thoughtful questions
- **Micro-Challenges**: Small, actionable revision tasks
- **Admissions Mode**: Evaluate essays against university-specific public values
- **Progress Tracking**: Visual progress bars and mastery indicators
- **Session Persistence**: Progress saved to localStorage

## Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Anthropic API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

3. Start the backend server:
```bash
npm run dev
```

4. In a separate terminal, start the frontend development server:
```bash
npm run client
```

5. Open your browser to `http://localhost:3000`

## Architecture

### Backend (`src/server.ts`)
- Express API server on port 3001
- Endpoints:
  - `POST /api/analyze-level` - Analyze essay for a specific skill level
  - `POST /api/admissions-eval` - Evaluate essay for admissions mode
  - `GET /api/universities` - Get list of available universities
  - `POST /api/critique` - Legacy endpoint (backward compatibility)

### Frontend (`src/client/`)
- React + TypeScript application
- Vite for build tooling
- Components:
  - `App.tsx` - Main application component
  - `LevelProgress.tsx` - Progress visualization
  - `EssayEditor.tsx` - Text editor for essays
  - `FeedbackPanel.tsx` - Display analysis feedback
  - `AdmissionsMode.tsx` - University evaluation interface

### Level System

1. **Clarity** (Level 1)
   - Express ideas simply and coherently
   - Focus on sentence structure and logical flow

2. **Specificity** (Level 2)
   - Ground claims in vivid, concrete details
   - Add sensory details and specific examples

3. **Reflection** (Level 3)
   - Reveal meaning, growth, and insight
   - Fitzpatrick framework reflection questions

4. **Voice** (Level 4)
   - Develop authentic tone and narrative coherence
   - Find unique personal voice

5. **Admissions Mode** (Final)
   - Evaluate against university-specific values
   - Stanford, Harvard, MIT, Yale, Princeton supported

## API Examples

### Analyze Essay for a Level

```bash
curl -X POST http://localhost:3001/api/analyze-level \
  -H "Content-Type: application/json" \
  -d '{
    "essay": "Your essay text here...",
    "level": "clarity",
    "sessionState": {}
  }'
```

### Admissions Evaluation

```bash
curl -X POST http://localhost:3001/api/admissions-eval \
  -H "Content-Type: application/json" \
  -d '{
    "essay": "Your essay text here...",
    "universityName": "Stanford"
  }'
```

## Learning Principles

- **Scaffolding**: Levels build progressively; prior mastery required
- **Metacognition**: Reflection prompts after every Claude suggestion
- **Cognitive Apprenticeship**: Claude models expert reasoning transparently
- **Transfer of Learning**: Admissions Mode tests skill application
- **Self-Determination Theory**: Motivation through autonomy, competence, and purpose

## Ethical Guardrails

- Claude never writes full paragraphs unprompted
- All text originates from students
- Admissions Mode uses publicly available rubric data
- No predictions of admission outcomes
- Transparent disclaimer about simulated feedback

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## License

ISC

