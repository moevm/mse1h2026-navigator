import os

import instructor
from openai import OpenAI

from ..model.base import ProfessionRoadmap


class SkillRelationNormalizer:
    _hf_url: str = "https://router.huggingface.co/v1"

    def __init__(
        self,
        skills_list,
        profession_name,
        hf_model_name=None,
    ):
        self._skills_list = skills_list
        self._profession_name = profession_name
        self._hf_model_name = hf_model_name or os.environ.get("HF_MODEL_NAME")
        self._hf_token = os.environ["HF_TOKEN"]

        if "" in [self._hf_model_name, self._hf_token]:
            raise ValueError("HF_MODEL_NAME and HF_TOKEN must be set")

        self._client = instructor.from_openai(
            OpenAI(
                base_url=self._hf_url,
                api_key=os.environ["HF_TOKEN"],
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
                        "Я дам тебе список сырых связей между технологиями. "
                        "Выбери из них только те, которые логичны для обучения (например, HTML -> CSS, "
                        "Relational Database -> PostgreSQL). Игнорируй нелогичные или слишком общие связи. "
                        "Необходимо, чтобы было меньше уровней вниз, чтобы уровни были широкие. "
                        "Уровней вложенности (вниз) должно быть мало. Может 3-4. Больше всего должно идти вширь. "
                        f"От стартового навыка ${self._profession_name} может быть максимум 5 связей. "
                        "К каждому навыку должна идти хотя бы одна связь и максимум одна связь (дерево). "
                        f"Изначальный, стартовый навык — это ${self._profession_name}. К нему не должно идти ничего. "
                        "Языки программирования должны идти в одну из первых очередей прямо от стартового навыка. "
                        "Постарайся задействовать максимум навыков. От одной технологии может идти много связей. "
                        "Если нужно немного изменить название для логики — делай, но редко."
                        "Чем навык проще и важнее, тем раньше он должен быть"
                    ),
                },
                {
                    "role": "user",
                    "content": self._skills_list,
                },
            ],
            max_retries=2,
        )
        return result.edges
