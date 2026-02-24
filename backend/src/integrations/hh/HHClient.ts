import { HHApiWrapper } from "./api/wrapper";
import type { VacancySearchParams, Vacancy, VacancyDetail, Employer, KeySkill } from "./api/types";


/**
 * Класс для работы с API HeadHunter
 */
export class HHClient {


  constructor(private readonly api: HHApiWrapper) {}

  /**
   * Публичный метод: Поиск навыков для профессии
   * @param job - Название профессии
   * @returns Список навыков
   */
  public async findVacancySkillsForProfession(profession: string): Promise<string[]> {
    try {
      const vacancies = await this.searchVacancies({ text: profession, page: 1, per_page: 10 });
      const skills = new Set<string>();
      for (const vacancy of vacancies.items) {
        const detail = await this.getVacancyDetail(vacancy.id);
        detail.key_skills.forEach((skill: KeySkill) => skills.add(skill.name));
      }
      return Array.from(skills);
    } catch (error) {
      console.error('Error finding vacancy skills for job:', error);
      return [];
    }
  }

  /**
   * Публичный метод: Получение всех вакансий
   * @param params - Параметры поиска
   * @returns Список вакансий
   */
  public async getVanaciesForProfessionDetails(params: VacancySearchParams = {}): Promise<VacancyDetail[]> {
    try {
      const vacancies = await this.searchVacancies(params);
      const vacanciesDetails = await Promise.all(vacancies.items.map((vacancy: Vacancy) => this.getVacancyDetail(vacancy.id)));
      return vacanciesDetails;
    } catch (error) {
      console.error('Error getting vacancies for profession details:', error);
      return [];
    }
  }


  // Приватные методы для внутреннего использования
  private async searchVacancies(params: VacancySearchParams) {
    return this.api.searchVacancies(params);
  }

  private async getVacancyDetail(vacancyId: string): Promise<VacancyDetail> {
    return this.api.getVacancyDetail(vacancyId);
  }
}