import { Field, ObjectType } from "type-graphql";
import { MainSkillGql } from "./MainSkill.type";
import { SkillGql } from "./Skill.type";
import { SkillsRelationGql } from "./SkillsRelation.type";

@ObjectType()
export class SavedSkillGraphGql {
  @Field()
  id: string = "";

  @Field()
  professionTitle: string = "";

  @Field(() => MainSkillGql)
  mainSkill: MainSkillGql = new MainSkillGql();

  @Field(() => [SkillGql])
  nodes: SkillGql[] = [];

  @Field(() => [SkillsRelationGql])
  edges: SkillsRelationGql[] = [];

  @Field(() => Date)
  createdAt: Date = new Date();

  @Field(() => Date)
  updatedAt: Date = new Date();
}

@ObjectType()
export class GraphListItemGql {
  @Field()
  id: string = "";

  @Field()
  professionTitle: string = "";

  @Field()
  normalizedProfessionTitle: string = "";

  @Field(() => Date)
  createdAt: Date = new Date();

  @Field(() => Date)
  updatedAt: Date = new Date();
}

@ObjectType()
export class UpdateGraphNodeResultGql {
  @Field(() => SkillGql)
  node: SkillGql = new SkillGql();

  @Field(() => [String])
  skills: string[] = [];
}
