import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MainSkillGql {
  @Field()
  id: string = "";

  @Field()
  title: string = "";

  @Field()
  description: string = "";
}
