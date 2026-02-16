import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface ExternalLMSCourse {
  id: string;
  lms_provider: 'tutor_lms' | 'internal' | 'external';
  external_id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  course_url: string;
  is_required: boolean;
  order_index: number;
  estimated_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lessons?: ExternalLMSLesson[];
  enrollment?: AdvisorLMSEnrollment;
}

export interface ExternalLMSLesson {
  id: string;
  course_id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  lesson_url: string;
  order_index: number;
  duration_minutes: number;
  has_video: boolean;
  has_quiz: boolean;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  completion?: AdvisorLessonCompletion;
}

export interface AdvisorLMSEnrollment {
  id: string;
  advisor_id: string;
  course_id: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'certified';
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percent: number;
  lessons_completed: number;
  total_lessons: number;
  certificate_earned: boolean;
  certificate_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvisorLessonCompletion {
  id: string;
  advisor_id: string;
  enrollment_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number;
  quiz_score: number | null;
  quiz_passed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CourseWithProgress extends ExternalLMSCourse {
  enrollment: AdvisorLMSEnrollment | undefined;
  lessonsWithProgress: LessonWithProgress[];
}

export interface LessonWithProgress extends ExternalLMSLesson {
  completion: AdvisorLessonCompletion | undefined;
}

// ============================================================================
// Course Functions
// ============================================================================

export async function getCourses(): Promise<ExternalLMSCourse[]> {
  const { data, error } = await supabase
    .from('external_lms_courses')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCourseById(courseId: string): Promise<ExternalLMSCourse | null> {
  const { data, error } = await supabase
    .from('external_lms_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getCourseLessons(courseId: string): Promise<ExternalLMSLesson[]> {
  const { data, error } = await supabase
    .from('external_lms_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================================================
// Enrollment Functions
// ============================================================================

export async function getAdvisorEnrollments(advisorId: string): Promise<AdvisorLMSEnrollment[]> {
  const { data, error } = await supabase
    .from('advisor_lms_enrollments')
    .select('*')
    .eq('advisor_id', advisorId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getEnrollmentForCourse(
  advisorId: string,
  courseId: string
): Promise<AdvisorLMSEnrollment | null> {
  const { data, error } = await supabase
    .from('advisor_lms_enrollments')
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('course_id', courseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function enrollInCourse(
  advisorId: string,
  courseId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('enroll_advisor_in_course', {
    p_advisor_id: advisorId,
    p_course_id: courseId,
  });

  if (error) throw error;
  return data;
}

// ============================================================================
// Lesson Completion Functions
// ============================================================================

export async function getLessonCompletions(
  advisorId: string,
  enrollmentId: string
): Promise<AdvisorLessonCompletion[]> {
  const { data, error } = await supabase
    .from('advisor_lesson_completions')
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('enrollment_id', enrollmentId);

  if (error) throw error;
  return data || [];
}

export async function startLesson(
  advisorId: string,
  lessonId: string
): Promise<AdvisorLessonCompletion> {
  // First get the enrollment_id for this lesson
  const { data: lesson } = await supabase
    .from('external_lms_lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  if (!lesson) throw new Error('Lesson not found');

  const { data: enrollment } = await supabase
    .from('advisor_lms_enrollments')
    .select('id')
    .eq('advisor_id', advisorId)
    .eq('course_id', lesson.course_id)
    .single();

  if (!enrollment) throw new Error('Not enrolled in this course');

  const { data, error } = await supabase
    .from('advisor_lesson_completions')
    .upsert(
      {
        advisor_id: advisorId,
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      },
      { onConflict: 'advisor_id,lesson_id' }
    )
    .select()
    .single();

  if (error) throw error;

  // Update enrollment started_at if this is the first lesson
  await supabase
    .from('advisor_lms_enrollments')
    .update({ started_at: new Date().toISOString(), status: 'in_progress' })
    .eq('id', enrollment.id)
    .is('started_at', null);

  return data;
}

export async function completeLesson(
  advisorId: string,
  lessonId: string,
  quizScore?: number,
  quizPassed?: boolean
): Promise<AdvisorLessonCompletion> {
  const { data: existing } = await supabase
    .from('advisor_lesson_completions')
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('lesson_id', lessonId)
    .single();

  if (!existing) throw new Error('Lesson completion record not found');

  const timeSpent = existing.started_at
    ? Math.round((Date.now() - new Date(existing.started_at).getTime()) / 60000)
    : 0;

  const { data, error } = await supabase
    .from('advisor_lesson_completions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      time_spent_minutes: existing.time_spent_minutes + timeSpent,
      quiz_score: quizScore ?? existing.quiz_score,
      quiz_passed: quizPassed ?? existing.quiz_passed,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLessonTime(
  advisorId: string,
  lessonId: string,
  additionalMinutes: number
): Promise<void> {
  const { error } = await supabase.rpc('increment_lesson_time', {
    p_advisor_id: advisorId,
    p_lesson_id: lessonId,
    p_minutes: additionalMinutes,
  });

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: existing } = await supabase
      .from('advisor_lesson_completions')
      .select('time_spent_minutes')
      .eq('advisor_id', advisorId)
      .eq('lesson_id', lessonId)
      .single();

    if (existing) {
      await supabase
        .from('advisor_lesson_completions')
        .update({
          time_spent_minutes: (existing.time_spent_minutes || 0) + additionalMinutes,
        })
        .eq('advisor_id', advisorId)
        .eq('lesson_id', lessonId);
    }
  }
}

// ============================================================================
// Combined Data Functions
// ============================================================================

export async function getCoursesWithProgress(
  advisorId: string
): Promise<CourseWithProgress[]> {
  // Get all courses
  const courses = await getCourses();

  // Get advisor enrollments
  const enrollments = await getAdvisorEnrollments(advisorId);
  const enrollmentMap = new Map(enrollments.map(e => [e.course_id, e]));

  // Build courses with progress
  const coursesWithProgress: CourseWithProgress[] = [];

  for (const course of courses) {
    const enrollment = enrollmentMap.get(course.id) || undefined;
    let lessonsWithProgress: LessonWithProgress[] = [];

    if (enrollment) {
      const lessons = await getCourseLessons(course.id);
      const completions = await getLessonCompletions(advisorId, enrollment.id);
      const completionMap = new Map(completions.map(c => [c.lesson_id, c]));

      lessonsWithProgress = lessons.map(lesson => ({
        ...lesson,
        completion: completionMap.get(lesson.id) || undefined,
      }));
    } else {
      const lessons = await getCourseLessons(course.id);
      lessonsWithProgress = lessons.map(lesson => ({
        ...lesson,
        completion: undefined,
      }));
    }

    coursesWithProgress.push({
      ...course,
      enrollment,
      lessonsWithProgress,
    });
  }

  return coursesWithProgress;
}

export async function getCourseWithProgress(
  advisorId: string,
  courseId: string
): Promise<CourseWithProgress | null> {
  const course = await getCourseById(courseId);
  if (!course) return null;

  const enrollment = await getEnrollmentForCourse(advisorId, courseId);
  const lessons = await getCourseLessons(courseId);

  let lessonsWithProgress: LessonWithProgress[] = [];

  if (enrollment) {
    const completions = await getLessonCompletions(advisorId, enrollment.id);
    const completionMap = new Map(completions.map(c => [c.lesson_id, c]));

    lessonsWithProgress = lessons.map(lesson => ({
      ...lesson,
      completion: completionMap.get(lesson.id) || undefined,
    }));
  } else {
    lessonsWithProgress = lessons.map(lesson => ({
      ...lesson,
      completion: undefined,
    }));
  }

  return {
    ...course,
    enrollment: enrollment || undefined,
    lessonsWithProgress,
  };
}

// ============================================================================
// Training Statistics
// ============================================================================

export interface TrainingStats {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number; // in minutes
  overallProgress: number; // percentage
  requiredCoursesCompleted: number;
  requiredCoursesTotal: number;
}

export async function getAdvisorTrainingStats(advisorId: string): Promise<TrainingStats> {
  const coursesWithProgress = await getCoursesWithProgress(advisorId);

  const stats: TrainingStats = {
    totalCourses: coursesWithProgress.length,
    enrolledCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalTimeSpent: 0,
    overallProgress: 0,
    requiredCoursesCompleted: 0,
    requiredCoursesTotal: 0,
  };

  for (const course of coursesWithProgress) {
    stats.totalLessons += course.lessonsWithProgress.length;

    if (course.is_required) {
      stats.requiredCoursesTotal++;
    }

    if (course.enrollment) {
      stats.enrolledCourses++;
      stats.completedLessons += course.enrollment.lessons_completed;

      if (course.enrollment.status === 'completed' || course.enrollment.status === 'certified') {
        stats.completedCourses++;
        if (course.is_required) {
          stats.requiredCoursesCompleted++;
        }
      }

      // Calculate time spent
      for (const lesson of course.lessonsWithProgress) {
        if (lesson.completion) {
          stats.totalTimeSpent += lesson.completion.time_spent_minutes || 0;
        }
      }
    }
  }

  // Calculate overall progress
  if (stats.totalLessons > 0) {
    stats.overallProgress = Math.round((stats.completedLessons / stats.totalLessons) * 100);
  }

  return stats;
}

// ============================================================================
// External LMS URL Helpers
// ============================================================================

export const MPB_TRAINING_BASE_URL = 'https://training.mpb.health';

export function getExternalLessonUrl(lesson: ExternalLMSLesson): string {
  return lesson.lesson_url;
}

export function getExternalCourseUrl(course: ExternalLMSCourse): string {
  return course.course_url;
}

export function openExternalLesson(lesson: ExternalLMSLesson): void {
  window.open(lesson.lesson_url, '_blank', 'noopener,noreferrer');
}

export function openExternalCourse(course: ExternalLMSCourse): void {
  window.open(course.course_url, '_blank', 'noopener,noreferrer');
}

// Export service object for compatibility
export const externalLMSService = {
  getCourses,
  getCourseById,
  getCourseLessons,
  getAdvisorEnrollments,
  getEnrollmentForCourse,
  enrollInCourse,
  getLessonCompletions,
  startLesson,
  completeLesson,
  updateLessonTime,
  getCoursesWithProgress,
  getCourseWithProgress,
  getAdvisorTrainingStats,
  getExternalLessonUrl,
  getExternalCourseUrl,
  openExternalLesson,
  openExternalCourse,
  MPB_TRAINING_BASE_URL,
};

export default externalLMSService;
