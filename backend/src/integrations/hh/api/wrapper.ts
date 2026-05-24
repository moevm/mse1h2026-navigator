import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders } from "axios";
import "dotenv/config";
import type {
	VacancyDetail,
	VacancySearchResponse,
	VacancySearchParams,
	EmployerSearchParams,
	EmployerSearchResponse,
} from "../types";

/**
 * Класс для работы с API HeadHunter
 */
export class HHApiWrapper {
	private client: AxiosInstance;

	constructor(
		private readonly baseURL: string = "https://api.hh.ru",
		private readonly timeout: number = 10000,
	) {
		this.client = axios.create({
			baseURL: this.baseURL,
			timeout: this.timeout,
		});

		this.client.interceptors.request.use(
			async (config) => {
				const userAgent =
					process.env.HH_USER_AGENT || "mse-navigator/1.0 (local development)";

				config.headers = new AxiosHeaders({
					...config.headers,
					"User-Agent": userAgent,
					"HH-User-Agent": userAgent,
				});

				return config;
			},
			(error) => {
				return Promise.reject(error);
			},
		);
	}

	async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.get<T>(url, config);
		return response.data;
	}

	async post<T>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response = await this.client.post<T>(url, data, config);
		return response.data;
	}

	/**
	 * Поиск вакансий
	 * @param params - Параметры поиска
	 * @returns Список вакансий
	 */
	async searchVacancies(
		params: VacancySearchParams,
	): Promise<VacancySearchResponse> {
		return this.get("/vacancies", { params });
	}

	/**
	 * Получение вакансии по ID
	 * @param vacancyId - ID вакансии
	 * @returns Вакансия
	 */
	async getVacancyDetail(vacancyId: string): Promise<VacancyDetail> {
		return this.get(`/vacancies/${vacancyId}`);
	}

	/**
	 * Поиск работодателей
	 * @param params - Параметры поиска
	 * @returns Список работодателей
	 */
	async getEmployers(
		params: EmployerSearchParams,
	): Promise<EmployerSearchResponse> {
		return this.get("/employers", { params });
	}
}