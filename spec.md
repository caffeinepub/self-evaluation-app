# Self Evaluation App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- A self-evaluation questionnaire with 6 health/wellness criteria, each rated 1-5
- Questions:
  1. How good is your grip (1=poor, 5=excellent)
  2. Can you get up and walk after a good night sleep (1=poor, 5=excellent)
  3. Can you remember any incident 20 years ago (1=poor, 5=excellent)
  4. Do you perspire after walking for 20 mins (1=poor, 5=excellent)
  5. Do you like to meet friends once a week (1=poor, 5=excellent)
  6. Is your skin dull (1=poor, 5=excellent)
- Interactive 1-5 rating selector for each question
- Results summary showing total score and per-category feedback
- Ability to save evaluation results to backend and view history
- Score interpretation (e.g. overall wellness level)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
- Backend: store evaluation submissions with scores per category and timestamp
- Backend: retrieve past evaluations for a user
- Frontend: questionnaire UI with 1-5 rating buttons per question
- Frontend: results page showing score breakdown and interpretation
- Frontend: history view of past evaluations
