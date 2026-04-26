# Quiz Module - Project Context

## Overview
The Quiz Module manages the "Quiz Game" feature, enabling pair-matching competitive quiz games. It includes a Super Admin (SA) interface for question management and a Public interface for gameplay.

## Architecture
- **API Layer:** 
  - `SAQuizQuestionsController`: `/sa/quiz/questions` (Basic Auth) - CRUD for questions.
  - `PublicQuizGameController`: `/pair-game-quiz/pairs` (JWT Auth) - Join games, submit answers, check status.
- **Application Layer:** 
  - CQRS pattern using `CommandBus` and `QueryBus`.
  - Handlers located in `src/modules/quiz/application/usecases/`.
- **Domain Layer (TypeORM Entities):**
  - `QuizQuestion`: Question text, correct answer variants (JSONB), publication status.
  - `QuizGame`: Manages game lifecycle (`PendingSecondPlayer` -> `Active` -> `Finished`).
  - `QuizPlayerProgress`: Tracks user score and their 5 specific answers.
  - `QuizAnswer`: Individual answer record with status (`Correct`/`Incorrect`) and timestamp.
- **Infrastructure Layer:**
  - Repositories for persistence and custom Query Repositories for view-model mapping.

## Core Logic & Scoring Rules
1. **Game Matching:** 
   - A user joining a game will either create a `PendingSecondPlayer` game or join an existing one.
   - When a game starts (`Active`), 5 random published questions are selected and fixed for that pair.
2. **Answering:** 
   - Users answer questions sequentially. 
   - Each correct answer (case-insensitive) awards **1 point**.
3. **Completion & Bonus:**
   - The game finishes when **both** players have submitted 5 answers.
   - **Faster Player Bonus:** The player who submitted their 5th answer **earliest** receives **+1 bonus point**, provided they had at least one correct answer during the game.
4. **Data Integrity:**
   - `TestingService` includes all quiz-related tables in its `deleteAllData` (TRUNCATE CASCADE) logic.

## Conventions
- **IDs:** Always use UUIDs.
- **Filtering:** SA question queries support `bodySearchTerm` and `publishedStatus`.
- **Sorting:** Default sort is `createdAt DESC`. Always ensure `sortDirection` is converted to uppercase for TypeORM.

## Next Steps / Future Enhancements
- **Statistics API:** Implement user-specific statistics (wins, losses, average scores) and a "Top Players" leaderboard.
- **Rate Limiting:** Re-enable and configure throttlers specifically for the answer submission endpoint to prevent brute-forcing.
- **Caching:** Consider caching published questions to reduce database load during random selection.
- **Real-time Updates:** Integrate WebSockets (Socket.io) to notify players when a second player joins or when an opponent submits an answer.
