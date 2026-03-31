export interface RawSkillEdge {
  from_skill: string;
  to_skill: string;
}

export interface RawSkillGraph {
  nodes: string[];
  edges: RawSkillEdge[];
}

export interface GetProfessionGraphRequest {
  profession_title: string;
  is_mock?: boolean;
  use_cache?: boolean;
}
