import { create } from 'zustand';
import { toast } from 'react-toastify';
import api from '../services/api';

interface PortfolioState {
  portfolios: any[];
  selectedPortfolio: any | null;
  positions: any[];
  loadPortfolios: () => Promise<void>;
  selectPortfolio: (portfolioId: string) => void;
  loadPositions: (portfolioId: string, online?: boolean) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  selectedPortfolio: null,
  positions: [],
  loadPortfolios: async () => {
    try {
      const response = await api.get('/portfolios');
      set({ portfolios: response.data });
    } catch (error) {
      console.error('Error loading portfolios:', error);
      toast.error('Error al cargar las carteras. Por favor, inténtelo de nuevo.');
    }
  },
  selectPortfolio: (portfolioId: string) => {
    const portfolio = get().portfolios.find(p => p.id === portfolioId);
    set({ selectedPortfolio: portfolio });
    if (portfolio) {
      get().loadPositions(portfolio.id);
    }
  },
  loadPositions: async (portfolioId: string, online: boolean = false) => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/positions?online=${online}`);
      set({ positions: response.data });
    } catch (error) {
      console.error('Error loading positions:', error);
      if (!online) { // No molestar con errores en el refresco automático de fondo
        toast.error('Error al cargar las posiciones de la cartera.');
      }
    }
  }
}));
