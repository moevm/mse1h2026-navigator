import os
import json

import instructor
from openai import OpenAI

from ..model.base import ProfessionRoadmap


class SkillRelationNormalizer:
    _hf_url: str = "https://router.huggingface.co/v1"

    def __init__(
        self,
        profession_name,
        available_skills,
        candidate_relations,
        initial_technologies=None,
        hf_model_name=None,
    ):
        self._profession_name = profession_name
        self._available_skills = available_skills
        self._candidate_relations = candidate_relations
        self._initial_technologies = initial_technologies or []
        self._hf_model_name = hf_model_name or os.environ.get("HF_MODEL_NAME")
        self._hf_token = os.environ["HF_TOKEN"]
        self._timeout = int(os.getenv("HF_REQUEST_TIMEOUT_SECONDS", "35"))

        if "" in [self._hf_model_name, self._hf_token]:
            raise ValueError("HF_MODEL_NAME and HF_TOKEN must be set")

        self._client = instructor.from_openai(
            OpenAI(
                base_url=self._hf_url,
                api_key=os.environ["HF_TOKEN"],
                timeout=self._timeout,
            ),
            mode=instructor.Mode.JSON,
        )

    def get_normalized_relations(self):
        result = self._client.chat.completions.create(
            model=self._hf_model_name,
            response_model=ProfessionRoadmap,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Ты — эксперт по backend-разработке. Твоя задача — составить roadmap. "
                        "Я дам тебе список доступных технологий, стартовые технологии пользователя "
                        "и список сырых связей между технологиями. "
                        "Стартовые технологии — это только якоря и контекст, а не полный ответ. "
                        "Они обязательно должны попасть в roadmap, но нужно также задействовать другие "
                        "релевантные технологии из available_skills и построить дальнейший путь обучения вокруг них. "
                        "Выбери или создай только те связи, которые логичны для обучения (например, HTML -> CSS, "
                        "Relational Database -> PostgreSQL). Игнорируй нелогичные или слишком общие связи. "
                        "Необходимо, чтобы было меньше уровней вниз, чтобы уровни были широкие. "
                        "Уровней вложенности (вниз) должно быть мало. Может 3-4. Больше всего должно идти вширь. "
                        f"От стартового навыка ${self._profession_name} может быть максимум 5 связей. "
                        "К каждому навыку должна идти хотя бы одна связь и максимум одна связь (дерево). "
                        f"Изначальный, стартовый навык — это ${self._profession_name}. К нему не должно идти ничего. "
                        "Языки программирования должны идти в одну из первых очередей прямо от стартового навыка. "
                        "Постарайся задействовать максимум навыков. От одной технологии может идти много связей. "
                        "Не возвращай roadmap, состоящий только из стартовых технологий пользователя. "
                        "Если нужно немного изменить название для логики — делай, но редко."
                        "Чем навык проще и важнее, тем раньше он должен быть"
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "available_skills": self._available_skills,
                            "initial_technologies": self._initial_technologies,
                            "candidate_relations": self._candidate_relations,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            max_retries=2,
        )
        return result.edges
