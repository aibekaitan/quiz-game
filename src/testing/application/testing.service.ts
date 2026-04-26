import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TestingService {
  constructor(private readonly dataSource: DataSource) {}

  async deleteAllData(): Promise<void> {
    const tables = [
      'quiz_answers',
      'quiz_player_progress',
      'quiz_game_questions',
      'quiz_games',
      'quiz_questions',
      'comments',
      'likes',
      'posts',
      'blogs',
      'devices',
      'users',
    ];

    try {
      // Use CASCADE to handle dependencies automatically
      // We join the table names into a single string for efficiency
      const tableNames = tables.map(t => `"${t}"`).join(', ');
      await this.dataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
    } catch (err) {
      console.error('Error during database cleanup:', err);
      // Fallback to individual deletes if TRUNCATE fails
      for (const table of tables) {
          try {
              await this.dataSource.query(`DELETE FROM "${table}";`);
          } catch (e) {}
      }
    }
  }
}
