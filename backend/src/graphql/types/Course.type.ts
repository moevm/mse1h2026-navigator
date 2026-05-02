import { Field, ObjectType } from "type-graphql";
import { LearningTimeInfoGql } from "./LearningTimeInfo.type";

@ObjectType()
export class CourseGql {
  @Field()
  id: string = "";

  @Field()
  title: string = "";

  @Field()
  description: string = "";

  @Field(() => LearningTimeInfoGql)
  learningTimeInfo: LearningTimeInfoGql = new LearningTimeInfoGql();

  @Field()
  link: string = "";

  @Field(() => String, { nullable: true })
  image?: string;
}
