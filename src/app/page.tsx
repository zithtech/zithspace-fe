import { redirect } from 'next/navigation';

export default function HomePage() {
  // Simply redirect to dashboard — middleware handles auth,
  // AuthContext + login page handle onboarding routing.
  redirect('/dashboard');
}
