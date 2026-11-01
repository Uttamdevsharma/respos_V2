import { redirect } from 'next/navigation';

export default function RestaurantsRedirectPage() {
  redirect('/super-admin/businesses');
}
