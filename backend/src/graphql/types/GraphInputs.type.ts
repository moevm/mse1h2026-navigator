import { Field, Float, InputType, Int } from "type-graphql";

@InputType()
export class LearningTimeInfoInput {
  @Field(() => Int)
  minHours: number = 0;

  @Field(() => Int)
  avgHours: number = 0;

  @Field(() => Int)
  maxHours: number = 0;

  @Field(() => Int)
  coursesAnalyzed: number = 0;
}

@InputType()
export class CourseInput {
  @Field()
  id: string = "";

  @Field()
  title: string = "";

  @Field()
  description: string = "";

  @Field(() => LearningTimeInfoInput, { nullable: true })
  learningTimeInfo?: LearningTimeInfoInput;

  @Field()
  link: string = "";

  @Field(() => String, { nullable: true })
  image?: string;
}

@InputType()
export class BookInput {
  @Field()
  id: string = "";

  @Field()
  title: string = "";

  @Field()
  author: string = "";

  @Field()
  description: string = "";

  @Field()
  link: string = "";

  @Field(() => String, { nullable: true })
  image?: string;
}

@InputType()
export class ArticleInput {
  @Field()
  id: string = "";

  @Field()
  title: string = "";

  @Field()
  description: string = "";

  @Field()
  link: string = "";

  @Field(() => Float)
  rating: number = 0;

  @Field(() => [String])
  tags: string[] = [];
}

@InputType()
export class CreateOrLoadGraphInput {
  @Field()
  professionTitle: string = "";

  @Field(() => String, { nullable: true })
  vacancyTitle?: string;

  @Field(() => [String], { nullable: true })
  initialTechnologies?: string[];

  @Field({ defaultValue: false })
  isMock: boolean = false;

  @Field({ defaultValue: false })
  forceRegenerate: boolean = false;
}

@InputType()
export class UpdateGraphNodeInput {
  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Boolean, { nullable: true })
  isCompleted?: boolean;

  @Field(() => Boolean, { nullable: true })
  isRequired?: boolean;

  @Field(() => Boolean, { nullable: true })
  isArchieved?: boolean;

  @Field(() => Int, { nullable: true })
  priority?: number;

  @Field(() => Int, { nullable: true })
  learnHours?: number;

  @Field(() => [CourseInput], { nullable: true })
  courses?: CourseInput[];

  @Field(() => [BookInput], { nullable: true })
  books?: BookInput[];

  @Field(() => [ArticleInput], { nullable: true })
  articles?: ArticleInput[];
}

@InputType()
export class CreateGraphNodeInput {
  @Field()
  title: string = "";

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Boolean, { nullable: true })
  isCompleted?: boolean;

  @Field(() => Boolean, { nullable: true })
  isRequired?: boolean;

  @Field(() => Boolean, { nullable: true })
  isArchieved?: boolean;

  @Field(() => Int, { nullable: true })
  priority?: number;

  @Field(() => Int, { nullable: true })
  learnHours?: number;

  @Field(() => [CourseInput], { nullable: true })
  courses?: CourseInput[];

  @Field(() => [BookInput], { nullable: true })
  books?: BookInput[];

  @Field(() => [ArticleInput], { nullable: true })
  articles?: ArticleInput[];
}

@InputType()
export class GraphEdgeInput {
  @Field()
  fromId: string = "";

  @Field()
  toId: string = "";
}
