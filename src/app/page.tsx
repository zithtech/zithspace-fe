import { redirect } from 'next/navigation';

export default function HomePage() {
  // Simply redirect to dashboard - middleware will handle auth
  redirect('/dashboard');
}
//comment added