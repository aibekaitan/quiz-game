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

### Phase 2: SA API (Quiz Questions CRUD) - [DONE]
1. **DTOs:** Implement `QuestionInputModel`, `PublishInputModel`, and `QuestionViewModel` (as per Swagger). - [DONE]
2. **Commands:** `CreateQuestion`, `UpdateQuestion`, `DeleteQuestion`, `PublishQuestion`. - [DONE]
3. **Queries:** `GetQuestions` with filtering (`bodySearchTerm`, `publishedStatus`) and pagination. - [DONE]
4. **Controller:** `SAQuizQuestionsController` at `/sa/quiz/questions` (Basic Auth). - [DONE]

### Phase 3: Public API (Pair Game Logic) - [DONE]
1. **Join/Create Logic (`/pairs/connection`):** - [DONE]
    - Check for existing active/pending game for user (403 if exists). - [DONE]
    - If a `PendingSecondPlayer` game exists: Join it, select 5 random published questions, set status to `Active`, and set `startGameDate`. - [DONE]
    - Otherwise: Create a new game with status `PendingSecondPlayer`. - [DONE]
2. **Current Game Query (`/pairs/my-current`):** - [DONE]
    - Return game in `PendingSecondPlayer` or `Active` status for the user. - [DONE]
3. **Game by ID Query (`/pairs/:id`):** - [DONE]
    - Return any game the user participated in (403 if not participant, 404 if not found). - [DONE]
4. **Answer Submission (`/pairs/my-current/answers`):** - [DONE]
    - Validate user is in an `Active` game and hasn't finished (403 if not). - [DONE]
    - Validate answer against `correctAnswers` (case-insensitive string match). - [DONE]
    - Increment `score` if correct. - [DONE]
    - **Completion Logic:** Award +1 bonus point to the player who finished all 5 questions first (if they have ≥1 correct answer). - [DONE]

### Phase 4: HW2 Features & Bug Fixes - [DONE]
...
4. **E2E Setup:** Ensure `TestingModule` is included in `AppModule` when `NODE_ENV=testing` to enable reliable database cleanup. - [DONE]

### Phase 5: HW3 Features & Optimization - [DONE]
1. **Top Users (`/users/top`):** Implement leaderboard with complex aggregation across all finished games. - [DONE]
2. **Multi-criteria Sorting:** Support `sort` query parameter as an array of strings (e.g., `?sort=avgScores desc&sort=sumScore desc`). - [DONE]
3. **Statistical Integrity:** Calculate `sumScore`, `avgScores`, `gamesCount`, `winsCount`, `lossesCount`, and `drawsCount` accurately using subqueries and grouping. - [DONE]
4. **Performance:** Use optimized SQL joins and raw results for statistics aggregation to handle large datasets efficiently. - [DONE]

## Verification & Testing
1. **Manual Verification:** All endpoints verified via Swagger/Postman. - [DONE]
2. **E2E Tests:** `quiz.e2e-spec.ts`, `sa-quiz.e2e-spec.ts`, `quiz-hw2.e2e-spec.ts`, and `quiz-hw3.e2e-spec.ts` all passing. - [DONE]
