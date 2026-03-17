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
