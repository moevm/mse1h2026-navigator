import { Field, ObjectType } from "type-graphql";
import { MainSkillGql } from "./MainSkill.type";
import { SkillGql } from "./Skill.type";
import { SkillsRelationGql } from "./SkillsRelation.type";

@ObjectType()
export class SkillGraphGql {
  @Field(() => MainSkillGql)
  mainSkill: MainSkillGql = new MainSkillGql();

  @Field(() => [SkillGql])
  nodes: SkillGql[] = [];

  @Field(() => [SkillsRelationGql])
  edges: SkillsRelationGql[] = [];
}
