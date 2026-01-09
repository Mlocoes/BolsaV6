import { create } from 'zustand';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DashboardStats } from '../services/dashboardService';

interface PortfolioState {
  portfolios: any[];
  selectedPortfolio: any | null;
  selectedDate: string | null;
  positions: any[];
  dashboardStats: DashboardStats | null;
  isRealTime: boolean;
  lastSync: Date | null;

  loadPortfolios: () => Promise<void>;
  selectPortfolio: (portfolioId: string) => void;
  setSelectedDate: (date: string | null) => void;
  loadPositions: (portfolioId: string, online?: boolean, date?: string | null) => Promise<void>;
  loadDashboardStats: (portfolioId: string, online?: boolean) => Promise<void>;
  syncData: (online?: boolean) => Promise<void>;
  setRealTime: (active: boolean) => void;
}

let intervalId: any = null;
let realTimeSubscribers = 0;

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  selectedPortfolio: null,
  selectedDate: null,
  positions: [],
  dashboardStats: null,
  isRealTime: false,
  lastSync: null,

  loadPortfolios: async () => {
    try {
      const response = await api.get('/portfolios');
      set({ portfolios: response.data });
      // If no portfolio selected, select the first one
      if (!get().selectedPortfolio && response.data.length > 0) {
        get().selectPortfolio(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      toast.error('Error al cargar las carteras.');
    }
  },

  selectPortfolio: (portfolioId: string) => {
    const portfolio = get().portfolios.find(p => p.id === portfolioId);
    set({ selectedPortfolio: portfolio });
    if (portfolio) {
      // Initial load (offline first for speed)
      get().syncData(false);
    }
  },

  setSelectedDate: (date: string | null) => {
    set({ selectedDate: date });
    const { selectedPortfolio, isRealTime, setRealTime } = get();

    // Si se selecciona una fecha histórica, desactivar tiempo real
    if (date && isRealTime) {
      setRealTime(false);
    }

    if (selectedPortfolio) {
      get().syncData(false);
    }
  },

  loadPositions: async (portfolioId: string, online: boolean = false, date: string | null = null) => {
    try {
      const params: any = { online };
      if (date) {
        params.target_date = date;
      }
      const response = await api.get(`/portfolios/${portfolioId}/positions`, { params });
      set({ positions: response.data });
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  },

  loadDashboardStats: async (portfolioId: string, online: boolean = false) => {
    try {
      const response = await api.get(`/dashboard/${portfolioId}/stats`, {
        params: { online }
      });
      set({ dashboardStats: response.data });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  },

  syncData: async (online: boolean = false) => {
    const { selectedPortfolio, selectedDate, loadPositions, loadDashboardStats } = get();
    if (!selectedPortfolio) return;

    try {
      // Si hay una fecha seleccionada, forzar online=false para evitar confusión
      const effectiveOnline = selectedDate ? false : online;

      // Run in parallel
      await Promise.all([
        loadPositions(selectedPortfolio.id, effectiveOnline, selectedDate),
        // Dashboard stats for now don't support history as easily, we'll focus on positions
        loadDashboardStats(selectedPortfolio.id, effectiveOnline)
      ]);
      set({ lastSync: new Date() });
    } catch (error) {
      console.error("Sync error:", error);
    }
  },

  setRealTime: (active: boolean) => {
    const { selectedDate } = get();

    // No permitir tiempo real si hay una fecha histórica seleccionada
    if (active && selectedDate) {
      console.warn('⚠️ No se puede activar tiempo real en una fecha histórica');
      return;
    }

    if (active) {
      realTimeSubscribers++;
      // Solo iniciar si es el primer suscriptor
      if (realTimeSubscribers === 1) {

        // Actualización inmediata
        get().syncData(true);

        // Iniciar intervalo (60s)
        intervalId = setInterval(() => {

          get().syncData(true);
        }, 60000);
      }
      set({ isRealTime: true });
    } else {
      realTimeSubscribers--;
      // Solo detener si no quedan suscriptores
      if (realTimeSubscribers <= 0) {
        realTimeSubscribers = 0;

        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        set({ isRealTime: false });
      }
    }
  }
}));
