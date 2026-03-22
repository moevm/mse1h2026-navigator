import { Field, Float, Int, ObjectType } from "type-graphql";

@ObjectType()
export class LearningTimeInfoGql {
  @Field(() => Float)
  minHours: number = 0;

  @Field(() => Float)
  avgHours: number = 0;

  @Field(() => Float)
  maxHours: number = 0;

  @Field(() => Int)
  coursesAnalyzed: number = 0;
}
