import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, Mensalidade, Filial, User } from '@/types';
import { mockClients, mockMensalidades, mockFiliais, mockUsers } from '@/data/mock';

interface AppState {
  // Data
  clients: Client[];
  mensalidades: Mensalidade[];
  filiais: Filial[];
  usuarios: User[];
  
  // Client actions
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Mensalidade actions
  setMensalidades: (mensalidades: Mensalidade[]) => void;
  addMensalidade: (mensalidade: Mensalidade) => void;
  updateMensalidade: (id: string, data: Partial<Mensalidade>) => void;
  updateMensalidades: (ids: string[], data: Partial<Mensalidade>) => void;
  
  // Filial actions
  setFiliais: (filiais: Filial[]) => void;
  addFilial: (filial: Filial) => void;
  updateFilial: (id: string, data: Partial<Filial>) => void;
  deleteFilial: (id: string) => void;
  
  // Usuario actions
  setUsuarios: (usuarios: User[]) => void;
  addUsuario: (usuario: User) => void;
  updateUsuario: (id: string, data: Partial<User>) => void;
  deleteUsuario: (id: string) => void;
}

// Helper to revive dates from JSON
const reviveDates = {
  client: (c: any): Client => ({
    ...c,
    createdAt: new Date(c.createdAt),
  }),
  mensalidade: (m: any): Mensalidade => ({
    ...m,
    dueDate: new Date(m.dueDate),
    paidAt: m.paidAt ? new Date(m.paidAt) : undefined,
    createdAt: new Date(m.createdAt),
  }),
  filial: (f: any): Filial => ({
    ...f,
    createdAt: new Date(f.createdAt),
  }),
  user: (u: any): User => ({
    ...u,
    createdAt: new Date(u.createdAt),
  }),
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial data
      clients: mockClients.map(reviveDates.client),
      mensalidades: mockMensalidades.map(reviveDates.mensalidade),
      filiais: mockFiliais.map(reviveDates.filial),
      usuarios: mockUsers.map(reviveDates.user),
      
      // Client actions
      setClients: (clients) => set({ clients: clients.map(reviveDates.client) }),
      addClient: (client) => set((state) => ({ 
        clients: [...state.clients, reviveDates.client(client)] 
      })),
      updateClient: (id, data) => set((state) => ({
        clients: state.clients.map(c => 
          c.id === id ? { ...c, ...data } : c
        )
      })),
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(c => c.id !== id)
      })),
      
      // Mensalidade actions
      setMensalidades: (mensalidades) => set({ 
        mensalidades: mensalidades.map(reviveDates.mensalidade) 
      }),
      addMensalidade: (mensalidade) => set((state) => ({ 
        mensalidades: [...state.mensalidades, reviveDates.mensalidade(mensalidade)] 
      })),
      updateMensalidade: (id, data) => set((state) => ({
        mensalidades: state.mensalidades.map(m => 
          m.id === id ? { ...m, ...data } : m
        )
      })),
      updateMensalidades: (ids, data) => set((state) => ({
        mensalidades: state.mensalidades.map(m => 
          ids.includes(m.id) ? { ...m, ...data } : m
        )
      })),
      
      // Filial actions
      setFiliais: (filiais) => set({ filiais: filiais.map(reviveDates.filial) }),
      addFilial: (filial) => set((state) => ({ 
        filiais: [...state.filiais, reviveDates.filial(filial)] 
      })),
      updateFilial: (id, data) => set((state) => ({
        filiais: state.filiais.map(f => 
          f.id === id ? { ...f, ...data } : f
        )
      })),
      deleteFilial: (id) => set((state) => ({
        filiais: state.filiais.filter(f => f.id !== id)
      })),
      
      // Usuario actions
      setUsuarios: (usuarios) => set({ usuarios: usuarios.map(reviveDates.user) }),
      addUsuario: (usuario) => set((state) => ({ 
        usuarios: [...state.usuarios, reviveDates.user(usuario)] 
      })),
      updateUsuario: (id, data) => set((state) => ({
        usuarios: state.usuarios.map(u => 
          u.id === id ? { ...u, ...data } : u
        )
      })),
      deleteUsuario: (id) => set((state) => ({
        usuarios: state.usuarios.filter(u => u.id !== id)
      })),
    }),
    {
      name: 'chitumbatv-store',
      // Revive dates when loading from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.clients = state.clients.map(reviveDates.client);
          state.mensalidades = state.mensalidades.map(reviveDates.mensalidade);
          state.filiais = state.filiais.map(reviveDates.filial);
          state.usuarios = state.usuarios.map(reviveDates.user);
        }
      },
    }
  )
);
