import re

from pydantic import BaseModel, Field, field_validator


class NormalizedSkill(BaseModel):
    skills: list[str] = Field(
        ...,
        description=(
            "Список нормализованных навыков. "
            "Нормализованный означает, что тут находится его самое "
            "распространенное название, которое можно будет найти на DBPeida"
        ),
    )

    @field_validator("skills")
    @classmethod
    def normalize_skills(cls, skills: list[str]) -> list[str]:
        if not skills:
            return []

        normalized = []
        seen = set()

        for skill in skills:
            if not isinstance(skill, str):
                continue

            s = skill.strip()
            s = s.lower()
            s = re.sub(r"[^\w\s\+\#\.\-]", "", s)
            s = re.sub(r"\s+", " ", s).strip()

            if not s:
                continue

            if s not in seen:
                seen.add(s)
                normalized.append(s)

        return normalized


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
