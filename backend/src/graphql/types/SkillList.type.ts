import { Field, Int, ObjectType } from "type-graphql";
import { SkillGql } from "./Skill.type";

@ObjectType()
export class PrioritySkillGroupGql {
  @Field(() => Int)
  priority: number = 0;

  @Field(() => [SkillGql])
  skills: SkillGql[] = [];
}

@ObjectType()
export class SkillListGql {
  @Field()
  graphId: string = "";

  @Field()
  professionTitle: string = "";

  @Field(() => [PrioritySkillGroupGql])
  currentPlan: PrioritySkillGroupGql[] = [];

  @Field(() => [SkillGql])
  completedSkills: SkillGql[] = [];

  @Field(() => [SkillGql])
  archivedSkills: SkillGql[] = [];
}
