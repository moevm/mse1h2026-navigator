import type { LearningTimeInfo } from "./basic.types";

export type StepikCourse = {
  id: number;

  title: string;
  title_en: string | null;
  slug: string;

  summary: string;
  description: string;
  workload: string | null;

  cover: string | null;
  intro: string;
  intro_video: string | null;

  language: string;
  difficulty: string;

  course_format: string;
  learning_format: string;

  target_audience: string;
  requirements: string;

  sections: number[];
  total_units: number;

  lessons_count: number;
  quizzes_count: number;
  challenges_count: number;
  peer_reviews_count: number;
  instructor_reviews_count: number;

  learners_count: number;
  learners_group: number | null;

  instructors: number[];
  authors: number[];

  tags: number[];

  acquired_skills: string[];
  acquired_assets: any[];

  actions: Record<
    string,
    {
      enabled: boolean;
      needs_permission?: string;
    }
  >;

  progress: any | null;

  first_lesson: number | null;
  first_unit: number | null;

  subscriptions: string[];
  announcements: any[];

  is_favorite: boolean;
  is_self_paced: boolean;
  is_adaptive: boolean;
  is_contest: boolean;
  is_in_wishlist: boolean;
  is_enabled: boolean;
  is_archived: boolean;
  is_active: boolean;
  is_public: boolean;
  is_paid: boolean;
  is_proctored: boolean;
  is_popular: boolean;
  is_processed_with_paddle: boolean;
  is_unsuitable: boolean;
  is_featured: boolean;
  is_censored: boolean;

  schedule_type: string;

  price: string | null;
  currency_code: string | null;
  display_price: string | null;

  canonical_url: string;
  continue_url: string;

  readiness: number;
  position: number;

  options: Record<string, any>;
  price_tier: any | null;

  review_summary: number;

  videos_duration: number;
  time_to_complete: number | null;

  certificates_count: number;
  with_certificate: boolean;

  is_certificate_issued: boolean;
  is_certificate_auto_issued: boolean;
  certificate_regular_threshold: number | null;
  certificate_distinction_threshold: number | null;

  certificate: string;
  certificate_footer: string | null;
  certificate_cover_org: string | null;

  certificate_link: string | null;
  certificate_regular_link: string | null;
  certificate_distinction_link: string | null;
  user_certificate: any | null;

  referral_link: string | null;

  schedule_link: string | null;
  schedule_long_link: string | null;

  first_deadline: string | null;
  last_deadline: string | null;

  last_step: string;

  social_providers: any[];

  has_tutors: boolean;

  proctor_url: string | null;

  default_promo_code_name: string | null;
  default_promo_code_price: string | null;
  default_promo_code_discount: string | null;
  default_promo_code_is_percent_discount: boolean | null;
  default_promo_code_expire_date: string | null;

  course_type: string;
  possible_type: string | null;

  preview_lesson: number | null;
  preview_unit: number | null;

  possible_currencies: any[];

  commission_basic: any | null;
  commission_promo: any | null;

  child_courses: number[];
  child_courses_count: number;
  parent_courses: number[];

  became_published_at: string | null;
  became_paid_at: string | null;
  last_update_price_date: string | null;

  owner: number;

  begin_date: string | null;
  end_date: string | null;
  soft_deadline: string | null;
  hard_deadline: string | null;

  grading_policy: string;
  begin_date_source: string | null;
  end_date_source: string | null;
  soft_deadline_source: string | null;
  hard_deadline_source: string | null;
  grading_policy_source: string;

  create_date: string;
  update_date: string;

  testers_group: number | null;
  moderators_group: number | null;
  assistants_group: number | null;
  teachers_group: number | null;
  admins_group: number | null;

  discussions_count: number;
  discussion_proxy: any | null;
  discussion_threads: any[];

  lti_consumer_key: string;
  lti_secret_key: string;
  lti_private_profile: boolean;

  enrollment: any | null;
  issue: any | null;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  learningTimeInfo: LearningTimeInfo;
  link: string;
  image?: string;
};
