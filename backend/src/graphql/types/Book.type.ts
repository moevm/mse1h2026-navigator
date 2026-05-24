import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class BookGql {
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
