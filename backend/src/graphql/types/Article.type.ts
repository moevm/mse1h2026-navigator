import { Field, Float, ObjectType } from "type-graphql";

@ObjectType()
export class ArticleGql {
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
