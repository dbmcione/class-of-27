import { supabase } from './supabase';

/** Where the tap happened, and who it belongs to. */
export type CourseClickSource =
  | { page: 'answers'; playerId: string }
  | { page: 'shared_answers'; code: string };

/**
 * Records a tap on "Know more about Class of ’27", for the sales sheet.
 *
 * Fire-and-forget: the link opens in a new tab straight away and this page
 * stays open, so the request finishes in the background. A click that fails
 * to record costs nothing the student would notice.
 */
export function recordCourseClick(source: CourseClickSource): void {
  if (!supabase) return;
  void supabase.rpc('record_course_click', {
    p_page: source.page,
    p_player_id: source.page === 'answers' ? source.playerId : null,
    p_code: source.page === 'shared_answers' ? source.code : null,
  });
}
