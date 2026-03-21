from typing import Optional

from pydantic import BaseModel


class ProfessionRequest(BaseModel):
    profession_title: str
    is_mock: Optional[bool] = False
    use_cache: Optional[bool] = True
