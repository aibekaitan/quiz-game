# Quiz Game Implementation Plan

## Objective
Implement a Quiz Game module featuring a Super Admin (SA) question management system and a Public pair-matching game with complex scoring logic, following the project's CQRS and Repository patterns.

## Key Files & Context
- `src/modules/quiz/`: New module for all quiz-related logic.
- `src/modules/bloggers-platform/`: Code style and structural reference.
- `src/modules/user-accounts/`: Integration for Authentication and User context.
- `requirements/quiz-game-notes/`: Source of truth for API specs and game rules.

## Implementation Steps

### Phase 1: Infrastructure & Documentation
1. **Move Plan:** Save this plan to `requirements/quiz-game-notes/QUIZ_IMPLEMENTATION_PLAN.md`.
2. **Module Setup:** Create `QuizModule` in `src/modules/quiz/`.
3. **Module Guidelines:** Create `src/modules/quiz/GEMINI.md` to document local module conventions, entity relations, and scoring rules.
4. **Entities:** Define TypeORM entities in `src/modules/quiz/domain/`:
    - `QuizQuestion`: `id` (UUID), `body` (10-500 chars), `correctAnswers` (`jsonb`), `published` (bool), `createdAt`, `updatedAt`.
    - `QuizGame`: `id` (UUID), `status` (`PendingSecondPlayer`, `Active`, `Finished`), `questions` (ManyToMany to `QuizQuestion`, ordered), `startGameDate`, `finishGameDate`.
    - `QuizPlayerProgress`: `id` (UUID), `userId` (Relation to `User`), `score` (number), `answers` (`jsonb` array of `AnswerViewModel`).

### Phase 2: SA API (Quiz Questions CRUD)
1. **DTOs:** Implement `QuestionInputModel`, `PublishInputModel`, and `QuestionViewModel` (as per Swagger).
2. **Commands:** `CreateQuestion`, `UpdateQuestion`, `DeleteQuestion`, `PublishQuestion`.
3. **Queries:** `GetQuestions` with filtering (`bodySearchTerm`, `publishedStatus`) and pagination.
4. **Controller:** `SAQuizQuestionsController` at `/sa/quiz/questions` (Basic Auth).

### Phase 3: Public API (Pair Game Logic)
1. **Join/Create Logic (`/pairs/connection`):**
    - Check for existing active/pending game for user (403 if exists).
    - If a `PendingSecondPlayer` game exists: Join it, select 5 random published questions, set status to `Active`, and set `startGameDate`.
    - Otherwise: Create a new game with status `PendingSecondPlayer`.
2. **Current Game Query (`/pairs/my-current`):**
    - Return game in `PendingSecondPlayer` or `Active` status for the user.
    - Ensure `questions` and `secondPlayerProgress` are `null` if pending.
3. **Game by ID Query (`/pairs/:id`):**
    - Return any game the user participated in (403 if not participant, 404 if not found).
4. **Answer Submission (`/pairs/my-current/answers`):**
    - Validate user is in an `Active` game and hasn't finished (403 if not).
    - Validate answer against `correctAnswers` (case-insensitive string match).
    - Increment `score` if correct.
    - **Completion Logic:** If this is the 10th answer total (both players finished):
        - Award +1 bonus point to the player who finished all 5 questions first (if they have ≥1 correct answer).
        - Set status to `Finished` and set `finishGameDate`.

### Phase 4: Scoring & Edge Cases
- **Bonus Point Rule:** Precisely track timestamps of the 5th answer for each player.
- **Randomization:** Ensure exactly 5 unique published questions are picked when a game starts.
- **Validation:** Strict `class-validator` decorators on all inputs to match Swagger constraints.

## Verification & Testing
1. **Manual Verification:** Run the provided test suite (which currently shows 404s) to ensure all paths are now reachable.
2. **Unit Tests:** Create tests for the scoring logic and the "faster player" bonus point calculation.
3. **E2E Tests:** Simulate two users joining and playing a full game to verify status transitions and date settings.
