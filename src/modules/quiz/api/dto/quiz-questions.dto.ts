import { IsArray, IsBoolean, IsNotEmpty, IsString, Length } from 'class-validator';

export class QuestionInputModel {
  @IsString()
  @Length(10, 500)
  @IsNotEmpty()
  body: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  correctAnswers: string[];
}

export class PublishInputModel {
  @IsBoolean()
  published: boolean;
}

export class QuestionViewModel {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string | null;
}
