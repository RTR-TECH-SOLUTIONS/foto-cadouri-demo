import { createContext, useContext } from 'react';
import type { AdminOrder, Appointment, Status } from './data';

export type Route = 'panou' | 'comenzi' | 'produse' | 'clienti' | 'studio' | 'bannere' | 'setari';
export type OrderFilter = Status | 'toate' | 'gravura' | 'de-trimis';
export interface Nav {
  route: Route;
  filter?: OrderFilter;
  open?: string;
}
export interface AdminState {
  now: number;
  nav: Nav;
  go: (route: Route, opts?: Omit<Nav, 'route'>) => void;
  orders: AdminOrder[];
  setStatus: (id: string, s: Status) => void;
  appointments: Appointment[];
  setAppointments: (fn: (list: Appointment[]) => Appointment[]) => void;
  toast: (msg: string) => void;
}
export const AdminCtx = createContext<AdminState | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;
