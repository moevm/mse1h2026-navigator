import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders } from 'axios';
import 'dotenv/config';
import type { VacancyDetail, VacancySearchResponse, VacancySearchParams } from '../types';

/**
 * Класс для работы с API HeadHunter
 */
export class HHApiWrapper {
  private client: AxiosInstance;

  constructor(private readonly baseURL: string = 'https://api.hh.ru', private readonly timeout: number = 10000) {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
    });

    this.client.interceptors.request.use(async (config) => {
		config.headers = new AxiosHeaders({
			...config.headers,
			'HH-User-Agent': process.env.HH_USER_AGENT || '',
		});
		return config;
	}, (error) => {
		return Promise.reject(error);
	});
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Поиск вакансий
   * @param params - Параметры поиска
   * @returns Список вакансий
   */
  async searchVacancies(params: VacancySearchParams): Promise<VacancySearchResponse> {
    return this.get('/vacancies', { params });
  }

  /**
   * Получение вакансии по ID
   * @param id - ID вакансии
   * @returns Вакансия
   */
  async getVacancyDetail(vacancyId: string): Promise<VacancyDetail> {
    return this.get(`/vacancies/${vacancyId}`);
  }
}