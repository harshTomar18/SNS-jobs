import { redirect } from 'next/navigation';

export default function WorkerLoginRedirect() {
  redirect('/login');
}
