import type { Course } from "../integrations/stepik/entity.types";
import { CourseGql } from "../graphql/types/Course.type";
import { LearningTimeInfoGql } from "../graphql/types/LearningTimeInfo.type";

export class CourseMapper {
  static toGql(course: Course): CourseGql {
    const timeInfo = new LearningTimeInfoGql();
    timeInfo.minHours = course.learningTimeInfo.minHours;
    timeInfo.avgHours = course.learningTimeInfo.avgHours;
    timeInfo.maxHours = course.learningTimeInfo.maxHours;
    timeInfo.coursesAnalyzed = course.learningTimeInfo.coursesAnalyzed;

    const gql = new CourseGql();
    gql.id = course.id;
    gql.title = course.title;
    gql.description = course.description;
    gql.link = course.link;
    gql.image = course.image;
    gql.learningTimeInfo = timeInfo;

    return gql;
  }

  static toGqlList(courses: Course[]): CourseGql[] {
    return courses.map((c) => CourseMapper.toGql(c));
  }
}
