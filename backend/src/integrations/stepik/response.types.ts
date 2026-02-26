import { StepikCourse } from "./entity.types";

export interface GetTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface StepikMeta {
  page: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface StepikPaginatedResponse {
  meta: StepikMeta;
}

export interface StepikCourseResponse extends StepikPaginatedResponse {
  courses: StepikCourse[];
}
