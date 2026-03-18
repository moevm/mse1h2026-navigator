import requests
from thefuzz import fuzz
from transliterate import translit


class SkillsFinder:
    roadmap_github_base_url = (
        "https://api.github.com/repos/kamranahmedse/"
        "developer-roadmap/contents/src/data/roadmaps/"
    )

    def __init__(self, profession_name, minimal_ratio=60):
        self._profession_name = profession_name
        self._minimal_ratio = minimal_ratio

    def get_skills_list(self):
        profession_name = self.__find_best_ratio_profession()

        gh_profession_url = f"{self.roadmap_github_base_url}{profession_name}/content"
        print(f"Profession URL: {gh_profession_url}")

        response = requests.get(gh_profession_url)
        data = response.json()

        skill_names = []

        for item in data:
            raw_name = item["name"]
            name_without_suffix = raw_name.split("@")[0]
            raw_parts = name_without_suffix.split("-")
            parts = [part for part in raw_parts if part]
            skill_name = " ".join(parts)

            skill_names.append(skill_name)

        print(f"Overall skills amount: {len(skill_names)}")

        return skill_names

    def __find_best_ratio_profession(self):
        profession_titles = self.__get_all_profession_names()

        formatted_titles = []
        for title in profession_titles:
            formatted_titles.append(" ".join(title.split("-")))

        query = self.__normalize(self._profession_name)

        best_ratio = 0
        best_profession = None

        for profession in formatted_titles:
            profession_norm = self.__normalize(profession)

            token_set = fuzz.token_set_ratio(query, profession_norm)
            partial = fuzz.partial_ratio(query, profession_norm)
            token_sort = fuzz.token_sort_ratio(query, profession_norm)

            ratio = max(token_set, partial, token_sort)

            if ratio == best_ratio:
                best_profession = (
                    profession
                    if not best_profession or len(profession) < len(best_profession)
                    else best_profession
                )

            if ratio > best_ratio:
                best_ratio = ratio
                best_profession = profession
                print(
                    f"Best ratio now is {best_ratio}. Comparing '{query}' with '{profession_norm}'"
                )

        if best_profession is None:
            return None

        if best_ratio >= self._minimal_ratio:
            return "-".join(best_profession.split(" "))

        return None

    def __get_all_profession_names(self):
        response = requests.get(self.roadmap_github_base_url)
        data = response.json()

        names = []
        for directory in data:
            names.append(directory["name"])

        return names

    def __normalize(self, text):
        text = text.lower()
        text = text.replace("_", " ")
        text = text.replace("-", " ")
        text = text.strip()

        try:
            text = translit(text, "ru", reversed=True)
        except Exception:
            pass

        return text
