import { redirect } from 'next/navigation';

export default function ReviewerRoot() {
  redirect('/reviewer/review-queue');
}
