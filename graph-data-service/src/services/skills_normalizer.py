import os

import instructor
from openai import OpenAI

from ..model.base import NormalizedSkill


class SkillsNormalizer:
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

    def get_normalized_skills(self):
        result = self._client.chat.completions.create(
            model=self._hf_model_name,
            response_model=NormalizedSkill,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Ты - специалист в области работы с DBPedia и тебе нужно найти скиллы "
                        f"которые помогут людям в изучении профессии {self._profession_name}. "
                        "Тебе нужно вернуть название скилла, которое максимально точно отобразит его название "
                        "и поможет найти его в DBPedia. Самое точное название, которое точно будет в DBPedia. "
                        "Все навыки должны быть, никакой нельзя упустить."
                    ),
                },
                {
                    "role": "user",
                    "content": self._skills_list,
                },
            ],
            max_retries=3,
        )
        return result
