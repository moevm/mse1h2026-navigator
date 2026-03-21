from pydantic import BaseModel, Field


class NormalizedSkill(BaseModel):
    skills: list[str] = Field(
        ...,
        description=(
            "Список нормализованных навыков. "
            "Нормализованный означает, что тут находится его самое "
            "распространенное название, которое можно будет найти на DBPeida"
        ),
    )


class SkillEdge(BaseModel):
    from_skill: str
    to_skill: str


class ProfessionRoadmap(BaseModel):
    """
    Структура дорожной карты развития по профессии.
    Связи должны отражать логику обучения: от основ к сложным инструментам.
    Если инструмент зависит от другого инструмента, то он должен идти только после него.
    """

    edges: list[SkillEdge]
