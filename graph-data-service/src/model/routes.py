from typing import Optional

from pydantic import BaseModel, StrictBool


class ProfessionRequest(BaseModel):
    profession_title: str
    initial_technologies: Optional[list[str]] = None
    is_mock: Optional[StrictBool] = False
    use_cache: Optional[StrictBool] = True
