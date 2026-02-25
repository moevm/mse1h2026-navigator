
/**
 * Базовый справочный тип (id + name)
 */
export interface DictionaryItem {
	id: string;
	name: string;
  }
  
  /**
   * Расширенный справочный тип с URL
   */
  export interface DictionaryItemWithUrl extends DictionaryItem {
	url: string;
  }
  export interface VacancySearchParams {
	/** Номер страницы (default: 0) */
	page?: number;
	/** Количество элементов на странице, max 100 (default: 10) */
	per_page?: number;
	/** Текст для поиска */
	text?: string;
	/** Область поиска (из справочника vacancy_search_fields) */
	search_field?: string | string[];
	/** Опыт работы (id из справочника experience) */
	experience?: string | string[];
	/** @deprecated Тип занятости (заменен на employment_form и label) */
	employment?: string | string[];
	/** @deprecated График работы (заменен на work_schedule_by_days, work_format и employment_form) */
	schedule?: string | string[];
	/** Регион (id из справочника /areas) */
	area?: string | string[];
	/** Ветка или станция метро (id из справочника /metro) */
	metro?: string | string[];
	/** Профессиональная область (id из справочника /professional_roles) */
	professional_role?: string | string[];
	/** Индустрия компании (id из справочника /industries) */
	industry?: string | string[];
	/** Идентификатор работодателя */
	employer_id?: string | string[];
	/** Код валюты (из справочника currency) */
	currency?: string;
	/** Размер заработной платы */
	salary?: number;
	/** Частота выплат (id из справочника salary_range_frequency) */
	salary_frequency?: string | string[];
	/** Гранулярность зарплаты (id из справочника salary_range_mode) */
	salary_mode?: string;
	/** Фильтр по меткам вакансий (id из справочника vacancy_label) */
	label?: string | string[];
	/** @deprecated Показывать вакансии только с указанием зарплаты (заменен на label=with_salary) */
	only_with_salary?: boolean;
	/** Количество дней для поиска */
	period?: number;
	/** Дата начала диапазона (формат ISO 8601: YYYY-MM-DD или YYYY-MM-DDThh:mm:ss±hhmm) */
	date_from?: string;
	/** Дата конца диапазона (формат ISO 8601: YYYY-MM-DD или YYYY-MM-DDThh:mm:ss±hhmm) */
	date_to?: string;
	/** Верхняя граница широты */
	top_lat?: number;
	/** Нижняя граница широты */
	bottom_lat?: number;
	/** Левая граница долготы */
	left_lng?: number;
	/** Правая граница долготы */
	right_lng?: number;
	/** Сортировка (из справочника vacancy_search_order) */
	order_by?: string;
	/** Широта точки сортировки (только при order_by=distance) */
	sort_point_lat?: number;
	/** Долгота точки сортировки (только при order_by=distance) */
	sort_point_lng?: number;
	/** Возвращать ли кластеры (default: false) */
	clusters?: boolean;
	/** Возвращать ли описание параметров (массив arguments) (default: false) */
	describe_arguments?: boolean;
	/** Отключить автоматическое преобразование запроса (default: false) */
	no_magic?: boolean;
	/** Учитывать премиум-вакансии в сортировке (default: false) */
	premium?: boolean;
	/** Включить поле counters с количеством откликов (default: false) */
	responses_count_enabled?: boolean;
	/** @deprecated Вакансии для подработки (заменен на working_hours, work_schedule_by_days, employment_form и label) */
	part_time?: string | string[];
	/** Поиск только по вакансиям временной работы (default: false) */
	accept_temporary?: boolean;
	/** Тип занятости (id из справочника vacancy_search_employment_form) */
	employment_form?: string | string[];
	/** График работы (id из справочника work_schedule_by_days) */
	work_schedule_by_days?: string | string[];
	/** Рабочие часы в день (id из справочника working_hours) */
	working_hours?: string | string[];
	/** Формат работы (id из справочника work_format) */
	work_format?: string | string[];
	/** Исключить слова (разделяются запятой) */
	excluded_text?: string;
	/** Образование: not_required_or_not_specified | special_secondary | higher */
	education?: 'not_required_or_not_specified' | 'special_secondary' | 'higher' | string[];
	/** Категория водительских прав (id из справочника driver_license_types) */
	driver_license_types?: string | string[];
	/** Доменное имя сайта (default: "hh.ru") */
	host?: 'hh.ru' | 'rabota.by' | 'hh1.az' | 'hh.uz' | 'hh.kz' | 'headhunter.ge' | 'headhunter.kg';
	/** Идентификатор локали (default: "RU") */
	locale?: string;
  }

  export interface MetroStation {
	station_name: string;
	line_name: string;
	station_id: string;
	line_id: string;
	lat: number | null;
	lng: number | null;
  }
  
  export interface Address {
	id: string | null;
	city: string | null;
	street: string | null;
	building: string | null;
	lat: number | null;
	lng: number | null;
	description: string | null;
	raw: string | null;
	metro: MetroStation | null;
	metro_stations: MetroStation[];
  }
  
  
  export interface LogoUrls {
	'90'?: string;
	'240'?: string;
	original: string;
  }
  
  export interface EmployerRating {
	rating?: number;
	reviews_count?: number;
  }

  export interface ApplicantServices {
	[key: string]: any;
  }
  
  export interface Employer {
	id: string | null;
	name: string;
	url: string | null;
	alternate_url: string | null;
	logo_urls: LogoUrls | null;
	vacancies_url: string | null;
	country_id: number;
	accredited_it_employer: boolean;
	trusted: boolean;
	employer_rating?: EmployerRating;
	is_identified_by_esia?: boolean;
	blacklisted?: boolean;
	applicant_services?: ApplicantServices;
  }
  
  export interface SalaryMode extends DictionaryItem {}
  
  export interface SalaryFrequency extends DictionaryItem {}
  
  /**
   * @deprecated Старый формат зарплаты (используйте SalaryRange)
   */
  export interface Salary {
	from: number | null;
	to: number | null;
	currency: string;
	gross: boolean | null;
  }
  
  export interface SalaryRange {
	from: number | null;
	to: number | null;
	currency: string;
	gross: boolean | null;
	mode: SalaryMode;
	frequency: SalaryFrequency;
  }
  
  export interface Department extends DictionaryItem {}
  
  export interface ContactPhone {
	city: string;
	country: string;
	formatted: string;
	number: string;
	comment?: string | null;
  }
  
  export interface Contact {
	name: string | null;
	email: string | null;
	phones: ContactPhone[];
	call_tracking_enabled?: boolean | null;
  }
  
  export interface InsiderInterview {
	id: string;
	url: string;
  }
  
  /**
   * Связи с вакансией
   */
  export type VacancyRelation = 
	| 'favorited'
	| 'got_response'
	| 'got_invitation'
	| 'got_rejection'
	| 'blacklisted';
  
  /**
   * Текстовые отрывки
   */
  export interface Snippet {
	requirement: string | null;
	responsibility: string | null;
  }
  
  /**
   * Счетчики откликов
   */
  export interface Counters {
	responses: number;
	total_responses: number;
  }
  
  /**
   * Договоры ГПХ
   */
  export interface CivilLawContract extends DictionaryItem {}
  
  /**
   * График и формат работы
   */
  export interface WorkFormat extends DictionaryItem {}
  
  export interface WorkScheduleByDays extends DictionaryItem {}
  
  export interface WorkingHours extends DictionaryItem {}
  
  export interface FlyInFlyOutDuration extends DictionaryItem {}
  
  /**
   * @deprecated
   */
  export interface WorkingDay extends DictionaryItem {}
  
  /**
   * @deprecated
   */
  export interface WorkingTimeInterval extends DictionaryItem {}
  
  /**
   * @deprecated
   */
  export interface WorkingTimeMode extends DictionaryItem {}

  /**
   * Возрастные ограничения
   */
  export interface AgeRestriction extends DictionaryItem {}

  /**
   * Настройки для автооткликов
   */
  export interface AutoResponse {
	accept_auto_response: boolean;
  }

  /**
   * Тестовое задание
   */
  export interface VacancyTest {
	id: string | null;
	required: boolean | null;
  }

  /**
   * Картинка шаблона конструктора вакансии
   */
  export interface TemplatePicture {
	url: string;
	width: number;
	height: number;
  }

  /**
   * @deprecated Шаблон конструктора вакансии
   */
  export interface VacancyConstructorTemplate {
	id: number;
	name: string;
	top_picture: TemplatePicture | null;
	bottom_picture: TemplatePicture | null;
  }

  /**
   * Свойства вакансии
   */
  export interface VacancyProperties {
	appearance: {
	  [key: string]: any;
	};
	properties: Array<{
	  id: string;
	  name: string;
	}>;
  }

  /**
   * Видео вакансия
   */
  export interface VideoPicture {
	url: string;
	width: number;
	height: number;
  }

  export interface Video {
	url: string;
	duration: number;
  }

  export interface VideoVacancy {
	cover_picture: VideoPicture | null;
	video: Video;
	/** @deprecated Используйте video.url */
	video_url?: string;
  }

  /**
   * Язык вакансии
   */
  export interface VacancyLanguage {
	id: string;
	name: string;
	level: DictionaryItem;
  }
  
  /**
   * Вакансия
   */
  export interface Vacancy {
	id: string;
	premium: boolean;
	name: string;
	department: Department | null;
	has_test: boolean;
	response_letter_required: boolean;
	area: DictionaryItemWithUrl;
	/** @deprecated Используйте salary_range */
	salary: Salary | null;
	salary_range: SalaryRange | null;
	type: DictionaryItem;
	address: Address | null;
	response_url: string | null;
	sort_point_distance: number | null;
	published_at: string;
	created_at: string;
	archived: boolean;
	apply_alternate_url: string;
	show_logo_in_search: boolean | null;
	show_contacts: boolean | null;
	insider_interview: InsiderInterview | null;
	url: string;
	alternate_url: string;
	relations: VacancyRelation[];
	employer: Employer;
	snippet: Snippet;
	contacts: Contact | null;
	/** @deprecated Используйте work_schedule_by_days */
	schedule: DictionaryItem | null;
	/** @deprecated */
	working_days: WorkingDay[];
	/** @deprecated */
	working_time_intervals: WorkingTimeInterval[];
	/** @deprecated */
	working_time_modes: WorkingTimeMode[];
	accept_temporary: boolean;
	fly_in_fly_out_duration: FlyInFlyOutDuration[];
	work_format: WorkFormat[];
	working_hours: WorkingHours[];
	work_schedule_by_days: WorkScheduleByDays[];
	accept_labor_contract: boolean;
	civil_law_contracts: CivilLawContract[];
	night_shifts: boolean;
	professional_roles: DictionaryItem[];
	accept_incomplete_resumes: boolean;
	experience: DictionaryItem | null;
	/** @deprecated Используйте employment_form */
	employment: DictionaryItem | null;
	employment_form: DictionaryItem | null;
	internship: boolean;
	counters?: Counters;
	// Дополнительные поля для рекламных вакансий
	adv_response_url?: string | null;
	is_adv_vacancy?: boolean;
	adv_context?: any;
  }
  
  /**
   * Детальная вакансия
   */
  export interface KeySkill {
	name: string;
  }
  
  export interface VacancyDetail extends Vacancy {
	/** Описание вакансии в HTML (не менее 200 символов) */
	description: string;
	/** Список ключевых навыков (не более 30) */
	key_skills: KeySkill[];
	/** HTML описание брендирования (может содержать <script/> и <style/>) */
	branded_description: string | null;
	/** Список требуемых категорий водительских прав */
	driver_license_types: DictionaryItem[];
	/** Языки вакансии */
	languages: VacancyLanguage[] | null;
	/** @deprecated Биллинговый тип вакансии (заменён на vacancy_properties) */
	billing_type: DictionaryItem | null;
	/** Возможность переписки с кандидатами */
	allow_messages: boolean;
	/** Вакансия доступна для соискателей с инвалидностью */
	accept_handicapped: boolean;
	/** @deprecated Вакансия доступна для соискателей старше 14 лет (используйте age_restriction) */
	accept_kids: boolean;
	/** Менеджер вакансии */
	manager: {
	  id: string;
	} | null;
	/** Возрастные ограничения */
	age_restriction: AgeRestriction | null;
	/** Настройки для автооткликов */
	auto_response: AutoResponse | null;
	/** Прошла ли вакансия модерацию */
	approved: boolean;
	/** Закрытая или открытая вакансия */
	closed_for_applicants: boolean | null;
	/** Внутренний код вакансии */
	code: string | null;
	/** @deprecated Дата и время публикации вакансии (дублирует published_at) */
	created_at: string;
	/** Дата и время создания вакансии */
	initial_created_at: string;
	/** Ссылка для получения списка откликов/приглашений */
	negotiations_url: string | null;
	/** Ссылка на подходящие резюме */
	suitable_resumes_url: string | null;
	/** Тестовое задание */
	test: VacancyTest | null;
	/** @deprecated Шаблон конструктора вакансии */
	vacancy_constructor_template: VacancyConstructorTemplate | null;
	/** Свойства вакансии (тариф, анонимность и др.) */
	vacancy_properties: VacancyProperties | null;
	/** Видео вакансия */
	video_vacancy: VideoVacancy | null;
	/** @deprecated Удалена ли вакансия (скрыта из архива) */
	hidden?: boolean;
  }
  
  /**
   * Ответ поиска
   */
  export interface VacancySearchResponse {
	items: Vacancy[];
	found: number;
	pages: number;
	page: number;
	per_page: number;
	clusters?: any;
	arguments?: any;
	alternate_url?: string;
  }