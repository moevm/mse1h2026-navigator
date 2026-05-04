import { Field, Float, Int, ObjectType } from "type-graphql";
import { CourseGql } from "./Course.type";
import { BookGql } from "./Book.type";
import { ArticleGql } from "./Article.type";

@ObjectType()
export class SkillGql {
  @Field()
  id: string = "";

  @Field()
  title: string = "";

  @Field()
  description: string = "";

  @Field()
  isCompleted: boolean = false;

  @Field()
  isRequired: boolean = false;

  @Field()
  isArchieved: boolean = false;

  @Field(() => Int)
  priority: number = 0;

  @Field(() => Float)
  learnHours: number = 0;

  @Field(() => [CourseGql], { nullable: true })
  courses?: CourseGql[];

  @Field(() => [BookGql], { nullable: true })
  books?: BookGql[];

  @Field(() => [ArticleGql], { nullable: true })
  articles?: ArticleGql[];
}
