import { create } from 'zustand';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DashboardStats } from '../services/dashboardService';

interface PortfolioState {
  portfolios: any[];
  selectedPortfolio: any | null;
  positions: any[];
  dashboardStats: DashboardStats | null;
  isRealTime: boolean;
  lastSync: Date | null;
  
  loadPortfolios: () => Promise<void>;
  selectPortfolio: (portfolioId: string) => void;
  loadPositions: (portfolioId: string, online?: boolean) => Promise<void>;
  loadDashboardStats: (portfolioId: string, online?: boolean) => Promise<void>;
  syncData: (online?: boolean) => Promise<void>;
  setRealTime: (active: boolean) => void;
}

let intervalId: any = null;

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  selectedPortfolio: null,
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

  loadPositions: async (portfolioId: string, online: boolean = false) => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/positions?online=${online}`);
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
      const { selectedPortfolio, loadPositions, loadDashboardStats } = get();
      if (!selectedPortfolio) return;

      try {
          // Run in parallel
          await Promise.all([
              loadPositions(selectedPortfolio.id, online),
              loadDashboardStats(selectedPortfolio.id, online)
          ]);
          set({ lastSync: new Date() });
      } catch (error) {
          console.error("Sync error:", error);
      }
  },

  setRealTime: (active: boolean) => {
      set({ isRealTime: active });
      
      if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
      }

      if (active) {
          // Immediate update
          get().syncData(true);
          
          // Start interval (60s)
          intervalId = setInterval(() => {
              console.log('🔄 Auto-refreshing data...');
              get().syncData(true);
          }, 60000);
      }
  }
}));
