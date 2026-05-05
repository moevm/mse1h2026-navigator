import { HHApiWrapper } from "./api/wrapper";
import type {
	VacancySearchParams,
	Vacancy,
	VacancyDetail,
	KeySkill,
	GetVacanciesForProfessionParams,
} from "./types";

export class HHClient {
	constructor(private readonly api: HHApiWrapper) {}

	/**
	 * Публичный метод: Поиск навыков для профессии
	 * @param profession - Название профессии
	 * @returns Список навыков
	 */
	public async findVacancySkillsForProfession(profession: string): Promise<string[]> {
		try {
			const vacancies = await this.api.searchVacancies({
				text: profession,
				page: 1,
				per_page: 6,
			});

			const skills = new Set<string>();

			const details = await Promise.allSettled(
				vacancies.items.map((vacancy: Vacancy) =>
					this.api.getVacancyDetail(vacancy.id),
				),
			);

			for (const result of details) {
				if (result.status !== "fulfilled") {
					continue;
				}

				result.value.key_skills.forEach((skill: KeySkill) =>
					skills.add(skill.name),
				);
			}

			return Array.from(skills);
		} catch (error) {
			console.error("Error finding vacancy skills for profession:", error);
			return [];
		}
	}

	/**
	 * Публичный метод: Получение детальной информации о всех вакансиях для профессии
	 * @param profession - Название профессии
	 * @returns Список вакансий
	 */
	public async getVanaciesForProfessionDetails({
		profession,
		employerName,
	}: GetVacanciesForProfessionParams): Promise<VacancyDetail[]> {
		const params: VacancySearchParams = {
			text: profession,
			page: 1,
			per_page: 10,
		};

		if (employerName) {
			const employers = await this.api.getEmployers({
				text: employerName,
				page: 1,
				per_page: 1,
			});

			if (employers.items.length > 0 && employers.items[0]) {
				params.employer_id = employers.items[0].id;
			}
		}

		try {
			const vacancies = await this.api.searchVacancies(params);

			const vacanciesDetails = await Promise.all(
				vacancies.items.map((vacancy: Vacancy) =>
					this.api.getVacancyDetail(vacancy.id),
				),
			);

			return vacanciesDetails;
		} catch (error) {
			console.error("Error getting vacancies for profession details:", error);
			return [];
		}
	}
}