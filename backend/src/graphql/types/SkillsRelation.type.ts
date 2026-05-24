import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class SkillsRelationGql {
  @Field()
  fromId: string = "";

  @Field()
  toId: string = "";
}
