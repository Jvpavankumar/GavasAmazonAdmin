export interface User {
  name: string;
  email: string;
  picture: string;
  location?: string;
  role?: 'customer' | 'admin';
}
