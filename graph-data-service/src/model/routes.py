from typing import Optional

from pydantic import BaseModel


class ProfessionRequest(BaseModel):
    profession_title: str
    initial_technologies: Optional[list[str]] = None
    is_mock: Optional[bool] = False
    use_cache: Optional[bool] = True
