import { injectable, singleton } from "tsyringe";
import axios, { AxiosRequestConfig } from "axios";

import { GetTokenResponse, StepikCourseResponse } from "./response.types";
import { OAuthTokenRequest, SearchCoursesRequest } from "./request.types";
import { Course, StepikCourse } from "./entity.types";

import {
  LearningTimeInfo,
  DurationEstimate,
  ConfidenceLevels,
} from "./basic.types";

@singleton()
@injectable()
export class StepikApiClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private expiresAt: number | null = null;

  private readonly baseUrl = "https://stepik.org";
  private readonly EXPIRY_BUFFER_MS = 60 * 1000;

  private readonly SECONDS_IN_HOUR = 3600;
  private readonly DEFAULT_SAMPLE_SIZE = 5;
  private readonly LESSON_DURATION_MINUTES = 20;
  private readonly MINUTES_IN_HOUR = 60;

  private readonly CONFIDENCE: ConfidenceLevels = {
    HIGH: 1,
    MEDIUM: 0.7,
    LOW: 0.4,
  };

  constructor() {
    this.clientId = process.env.STEPIK_CLIENT_ID || "";
    this.clientSecret = process.env.STEPIK_CLIENT_SECRET || "";
  }

  public async getAgregatedCourseInfo(title: string): Promise<Course | null> {
    try {
      const response: StepikCourseResponse =
        await this.searchCoursesByName(title);

      if (!response.courses.length) {
        return null;
      }

      const stepikCourse: StepikCourse | undefined = response.courses[0];
      if (!stepikCourse) {
        return null;
      }

      const learningTimeInfo: LearningTimeInfo =
        this.estimateCourseLearningTime(stepikCourse);

      return {
        id: String(stepikCourse.id),
        title: stepikCourse.title,
        description: stepikCourse.description,
        learningTimeInfo,
        link: `https://stepik.org/course/${stepikCourse.id}/promo`,
        image: stepikCourse.cover || undefined,
      };
    } catch (e: unknown) {
      console.error(e);
      return null;
    }
  }

  private estimateCourseLearningTime(course: StepikCourse): LearningTimeInfo {
    const duration = this.extractCourseDuration(course);

    if (duration === null) {
      return {
        minHours: 0,
        avgHours: 0,
        maxHours: 0,
        coursesAnalyzed: 1,
      };
    }

    const hours = Math.round(duration);

    return {
      minHours: hours,
      avgHours: hours,
      maxHours: hours,
      coursesAnalyzed: 1,
    };
  }

  public async searchCoursesByName(
    name: string,
    page: number = 1,
  ): Promise<StepikCourseResponse> {
    const params: SearchCoursesRequest = {
      search: name,
      page,
    };

    return this.request<StepikCourseResponse>({
      method: "GET",
      url: `${this.baseUrl}/api/courses`,
      params,
    });
  }

  public async estimateSkillLearningTime(
    skillName: string,
    sampleSize: number = this.DEFAULT_SAMPLE_SIZE,
  ): Promise<LearningTimeInfo> {
    const courses = await this.getAllCoursesByName(skillName, sampleSize);

    if (!courses.length) {
      throw new Error("No courses found for this skill");
    }

    const durations = courses
      .map((course) => this.extractCourseDuration(course))
      .filter((d): d is number => d !== null);

    if (!durations.length) {
      throw new Error("Unable to estimate course durations");
    }

    return this.calculateStats(durations);
  }

  public async getAllCoursesByName(
    name: string,
    maxLength = 10,
  ): Promise<StepikCourse[]> {
    let allCourses: StepikCourse[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext && allCourses.length < maxLength) {
      const { courses, meta } = await this.searchCoursesByName(name, page);

      allCourses.push(...courses);
      hasNext = meta.has_next;
      page++;
    }

    return allCourses;
  }

  private extractCourseDuration(course: StepikCourse): number | null {
    const durations: DurationEstimate[] = [];

    if (this.isPositiveNumber(course.time_to_complete)) {
      durations.push({
        value: course.time_to_complete / this.SECONDS_IN_HOUR,
        confidence: this.CONFIDENCE.HIGH,
      });
    }

    const workloadNumber = this.parseWorkload(course.workload);

    if (this.isPositiveNumber(workloadNumber)) {
      durations.push({
        value: workloadNumber,
        confidence: this.CONFIDENCE.MEDIUM,
      });
    }

    if (this.isPositiveNumber(course.lessons_count)) {
      const hours =
        (course.lessons_count * this.LESSON_DURATION_MINUTES) /
        this.MINUTES_IN_HOUR;

      durations.push({
        value: hours,
        confidence: this.CONFIDENCE.LOW,
      });
    }

    if (!durations.length) return null;

    const totalWeight = durations.reduce((s, d) => s + d.confidence, 0);

    const weighted =
      durations.reduce((s, d) => s + d.value * d.confidence, 0) / totalWeight;

    return weighted;
  }

  private calculateStats(durations: number[]): LearningTimeInfo {
    const total = durations.reduce((sum, d) => sum + d, 0);
    const avg = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      avgHours: Math.round(avg),
      minHours: Math.round(min),
      maxHours: Math.round(max),
      coursesAnalyzed: durations.length,
    };
  }

  private parseWorkload(workload: string | null): number | null {
    if (!workload) return null;

    const parsed = parseFloat(workload.replace(",", "."));

    return isNaN(parsed) ? null : parsed;
  }

  private isPositiveNumber(value: unknown): value is number {
    return typeof value === "number" && value > 0;
  }

  private async request<TResponse>(
    config: AxiosRequestConfig,
  ): Promise<TResponse> {
    const token = await this.getValidAccessToken();

    const response = await axios({
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  private async getValidAccessToken(): Promise<string> {
    if (!this.isTokenValid()) {
      await this.refreshToken();
    }
    return this.accessToken!;
  }

  private isTokenValid(): boolean {
    if (!this.accessToken || !this.expiresAt) return false;
    const now = Date.now();
    return now < this.expiresAt - this.EXPIRY_BUFFER_MS;
  }

  private async refreshToken(): Promise<void> {
    const tokenResponse = await this.getToken();
    this.accessToken = tokenResponse.access_token;
    this.expiresAt = Date.now() + tokenResponse.expires_in * 1000;
  }

  private async getToken(): Promise<GetTokenResponse> {
    const payload: OAuthTokenRequest = {
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    const params = new URLSearchParams();

    Object.entries(payload).forEach(([key, value]) => {
      params.append(key, value);
    });

    const response = await axios.post<GetTokenResponse>(
      `${this.baseUrl}/oauth2/token/`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data;
  }
}
