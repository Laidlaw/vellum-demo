import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

type SourceBucket = 'cart' | 'quote';

export interface StorefrontLineItem {
  handle: string;
  quantity: number;
  addedAt: string;
}

export interface QuoteDraftDetails {
  teamName: string;
  notes: string;
  requestedDeliveryDate?: string;
}

export interface QuoteDraft {
  items: StorefrontLineItem[];
  details: QuoteDraftDetails;
  lastPrefillQuoteId?: string;
  lastUpdatedAt: string;
}

export interface QuoteRecord {
  id: string;
  createdAt: string;
  submittedAt: string;
  details: QuoteDraftDetails;
  items: StorefrontLineItem[];
}

export interface StorefrontState {
  cart: StorefrontLineItem[];
  quoteDraft: QuoteDraft;
  quoteHistory: QuoteRecord[];
}

const STORAGE_KEY = 'vellum-storefront/state/v1';

type Action =
  | { type: 'ADD_TO_CART'; handle: string; quantity: number }
  | { type: 'ADD_TO_QUOTE'; handle: string; quantity: number }
  | { type: 'UPDATE_QUANTITY'; target: SourceBucket; handle: string; quantity: number }
  | { type: 'REMOVE_ITEM'; target: SourceBucket; handle: string }
  | { type: 'MOVE_ITEM'; from: SourceBucket; to: SourceBucket; handle: string }
  | { type: 'CLEAR_CART' }
  | { type: 'CLEAR_QUOTE_DRAFT' }
  | { type: 'SET_QUOTE_DETAILS'; details: Partial<QuoteDraftDetails> }
  | { type: 'SUBMIT_QUOTE'; record: QuoteRecord }
  | { type: 'PREFILL_QUOTE'; record: QuoteRecord };

function addLineItem(list: StorefrontLineItem[], handle: string, quantity: number) {
  const existingIndex = list.findIndex((item) => item.handle === handle);
  if (existingIndex >= 0) {
    const items = [...list];
    const existing = items[existingIndex];
    items[existingIndex] = { ...existing, quantity: existing.quantity + quantity };
    return items;
  }

  return [
    ...list,
    {
      handle,
      quantity,
      addedAt: new Date().toISOString(),
    },
  ];
}

function updateLineItemQuantity(list: StorefrontLineItem[], handle: string, quantity: number) {
  if (quantity <= 0) {
    return list.filter((item) => item.handle !== handle);
  }

  return list.map((item) => (item.handle === handle ? { ...item, quantity } : item));
}

function removeLineItem(list: StorefrontLineItem[], handle: string) {
  return list.filter((item) => item.handle !== handle);
}

function cloneLineItems(items: StorefrontLineItem[]) {
  const clonedAt = new Date().toISOString();
  return items.map((item, index) => ({
    handle: item.handle,
    quantity: item.quantity,
    addedAt: new Date(new Date(clonedAt).getTime() + index * 1000).toISOString(),
  }));
}

function moveLineItem(state: StorefrontState, from: SourceBucket, to: SourceBucket, handle: string): StorefrontState {
  if (from === to) return state;
  const sourceItems = from === 'cart' ? state.cart : state.quoteDraft.items;
  const targetItems = to === 'cart' ? state.cart : state.quoteDraft.items;
  const item = sourceItems.find((entry) => entry.handle === handle);
  if (!item) return state;

  const updatedSource = removeLineItem(sourceItems, handle);
  const updatedTarget = addLineItem(targetItems, item.handle, item.quantity);

  if (from === 'cart' && to === 'quote') {
    return {
      ...state,
      cart: updatedSource,
      quoteDraft: {
        ...state.quoteDraft,
        items: updatedTarget,
        lastUpdatedAt: new Date().toISOString(),
      },
    };
  }

  if (from === 'quote' && to === 'cart') {
    return {
      ...state,
      cart: updatedTarget,
      quoteDraft: {
        ...state.quoteDraft,
        items: updatedSource,
        lastUpdatedAt: new Date().toISOString(),
      },
    };
  }

  return state;
}

const now = new Date();
const days = (count: number) => 1000 * 60 * 60 * 24 * count;

const defaultState: StorefrontState = {
  cart: [],
  quoteDraft: {
    items: [],
    details: {
      teamName: '',
      notes: '',
      requestedDeliveryDate: '',
    },
    lastUpdatedAt: now.toISOString(),
  },
  quoteHistory: [
    {
      id: 'Q-10421',
      createdAt: new Date(now.getTime() - days(18)).toISOString(),
      submittedAt: new Date(now.getTime() - days(18)).toISOString(),
      details: {
        teamName: 'North River Expansion',
        notes: 'Stage pallet jacks at dock 3 and stagger PPE replenishment by crew size.',
        requestedDeliveryDate: new Date(now.getTime() + days(14)).toISOString().slice(0, 10),
      },
      items: [
        {
          handle: 'folding-platform-cart',
          quantity: 2,
          addedAt: new Date(now.getTime() - days(19)).toISOString(),
        },
        {
          handle: 'hi-visibility-safety-vest',
          quantity: 24,
          addedAt: new Date(now.getTime() - days(19)).toISOString(),
        },
        {
          handle: 'industrial-angle-grinder',
          quantity: 3,
          addedAt: new Date(now.getTime() - days(19)).toISOString(),
        },
      ],
    },
  ],
};

function sanitizeLineItems(value: unknown): StorefrontLineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item !== 'object' || !item) return null;
      const handle = typeof (item as Record<string, unknown>).handle === 'string' ? (item as Record<string, unknown>).handle : null;
      if (!handle) return null;
      const quantityInput = (item as Record<string, unknown>).quantity;
      const quantity = typeof quantityInput === 'number' && Number.isFinite(quantityInput) && quantityInput > 0 ? Math.floor(quantityInput) : 1;
      const addedAtValue = (item as Record<string, unknown>).addedAt;
      const addedAt = typeof addedAtValue === 'string' && addedAtValue ? addedAtValue : new Date().toISOString();
      return { handle, quantity, addedAt };
    })
    .filter((item): item is StorefrontLineItem => Boolean(item));
}

function sanitizeQuoteDetails(details: unknown): QuoteDraftDetails {
  if (typeof details !== 'object' || !details) {
    return {
      teamName: '',
      notes: '',
      requestedDeliveryDate: '',
    };
  }

  const record = details as Record<string, unknown>;
  return {
    teamName: typeof record.teamName === 'string' ? record.teamName : '',
    notes: typeof record.notes === 'string' ? record.notes : '',
    requestedDeliveryDate: typeof record.requestedDeliveryDate === 'string' ? record.requestedDeliveryDate : '',
  };
}

function sanitizeQuoteRecord(record: unknown): QuoteRecord | null {
  if (typeof record !== 'object' || !record) return null;
  const value = record as Record<string, unknown>;
  const id = typeof value.id === 'string' ? value.id : null;
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : null;
  const submittedAt = typeof value.submittedAt === 'string' ? value.submittedAt : null;
  if (!id || !createdAt || !submittedAt) return null;

  return {
    id,
    createdAt,
    submittedAt,
    details: sanitizeQuoteDetails(value.details),
    items: sanitizeLineItems(value.items),
  };
}

function getInitialState(initialArg?: StorefrontState): StorefrontState {
  if (typeof window === 'undefined') {
    return initialArg ?? defaultState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialArg ?? defaultState;
    }

    const raw = JSON.parse(stored) as Partial<StorefrontState>;

    const cart = sanitizeLineItems(raw.cart);
    const quoteDraftItems = sanitizeLineItems(raw.quoteDraft?.items);
    const quoteDraftDetails = sanitizeQuoteDetails(raw.quoteDraft?.details);
    const quoteHistory = Array.isArray(raw.quoteHistory)
      ? raw.quoteHistory.map(sanitizeQuoteRecord).filter((item): item is QuoteRecord => Boolean(item))
      : defaultState.quoteHistory;

    return {
      cart,
      quoteDraft: {
        items: quoteDraftItems,
        details: quoteDraftDetails,
        lastPrefillQuoteId: typeof raw.quoteDraft?.lastPrefillQuoteId === 'string' ? raw.quoteDraft.lastPrefillQuoteId : undefined,
        lastUpdatedAt: typeof raw.quoteDraft?.lastUpdatedAt === 'string' ? raw.quoteDraft.lastUpdatedAt : new Date().toISOString(),
      },
      quoteHistory: quoteHistory.length ? quoteHistory : (initialArg ?? defaultState).quoteHistory,
    };
  } catch {
    return initialArg ?? defaultState;
  }
}

function reducer(state: StorefrontState, action: Action): StorefrontState {
  switch (action.type) {
    case 'ADD_TO_CART':
      return {
        ...state,
        cart: addLineItem(state.cart, action.handle, action.quantity),
      };
    case 'ADD_TO_QUOTE':
      return {
        ...state,
        quoteDraft: {
          ...state.quoteDraft,
          items: addLineItem(state.quoteDraft.items, action.handle, action.quantity),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    case 'UPDATE_QUANTITY': {
      if (action.target === 'cart') {
        return {
          ...state,
          cart: updateLineItemQuantity(state.cart, action.handle, action.quantity),
        };
      }

      return {
        ...state,
        quoteDraft: {
          ...state.quoteDraft,
          items: updateLineItemQuantity(state.quoteDraft.items, action.handle, action.quantity),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    }
    case 'REMOVE_ITEM': {
      if (action.target === 'cart') {
        return {
          ...state,
          cart: removeLineItem(state.cart, action.handle),
        };
      }

      return {
        ...state,
        quoteDraft: {
          ...state.quoteDraft,
          items: removeLineItem(state.quoteDraft.items, action.handle),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    }
    case 'MOVE_ITEM':
      return moveLineItem(state, action.from, action.to, action.handle);
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'CLEAR_QUOTE_DRAFT':
      return {
        ...state,
        quoteDraft: {
          ...state.quoteDraft,
          items: [],
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    case 'SET_QUOTE_DETAILS':
      return {
        ...state,
        quoteDraft: {
          ...state.quoteDraft,
          details: { ...state.quoteDraft.details, ...action.details },
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    case 'SUBMIT_QUOTE':
      return {
        ...state,
        cart: state.cart,
        quoteDraft: {
          ...state.quoteDraft,
          items: [],
          lastUpdatedAt: action.record.submittedAt,
          lastPrefillQuoteId: undefined,
        },
        quoteHistory: [action.record, ...state.quoteHistory],
      };
    case 'PREFILL_QUOTE':
      return {
        ...state,
        quoteDraft: {
          items: cloneLineItems(action.record.items),
          details: { ...action.record.details },
          lastPrefillQuoteId: action.record.id,
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    default:
      return state;
  }
}

interface StorefrontContextValue {
  state: StorefrontState;
  cartCount: number;
  quoteDraftCount: number;
  addToCart: (handle: string, quantity?: number) => void;
  addToQuote: (handle: string, quantity?: number) => void;
  moveItemToCart: (handle: string) => void;
  moveItemToQuote: (handle: string) => void;
  updateCartQuantity: (handle: string, quantity: number) => void;
  updateQuoteQuantity: (handle: string, quantity: number) => void;
  removeCartItem: (handle: string) => void;
  removeQuoteItem: (handle: string) => void;
  clearCart: () => void;
  clearQuoteDraft: () => void;
  setQuoteDetails: (details: Partial<QuoteDraftDetails>) => void;
  submitQuote: () => QuoteRecord | undefined;
  prefillQuoteFromHistory: (quoteId: string) => void;
}

const StorefrontStateContext = createContext<StorefrontContextValue | undefined>(undefined);

function generateQuoteId() {
  const timestamp = new Date();
  const datePart = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(100 + Math.random() * 900).toString();
  return `Q-${datePart}-${randomPart}`;
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState, getInitialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const contextValue = useMemo<StorefrontContextValue>(() => {
    const cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);
    const quoteDraftCount = state.quoteDraft.items.reduce((total, item) => total + item.quantity, 0);

    return {
      state,
      cartCount,
      quoteDraftCount,
      addToCart: (handle, quantity = 1) => dispatch({ type: 'ADD_TO_CART', handle, quantity }),
      addToQuote: (handle, quantity = 1) => dispatch({ type: 'ADD_TO_QUOTE', handle, quantity }),
      moveItemToCart: (handle) => dispatch({ type: 'MOVE_ITEM', from: 'quote', to: 'cart', handle }),
      moveItemToQuote: (handle) => dispatch({ type: 'MOVE_ITEM', from: 'cart', to: 'quote', handle }),
      updateCartQuantity: (handle, quantity) => dispatch({ type: 'UPDATE_QUANTITY', target: 'cart', handle, quantity }),
      updateQuoteQuantity: (handle, quantity) =>
        dispatch({ type: 'UPDATE_QUANTITY', target: 'quote', handle, quantity }),
      removeCartItem: (handle) => dispatch({ type: 'REMOVE_ITEM', target: 'cart', handle }),
      removeQuoteItem: (handle) => dispatch({ type: 'REMOVE_ITEM', target: 'quote', handle }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      clearQuoteDraft: () => dispatch({ type: 'CLEAR_QUOTE_DRAFT' }),
      setQuoteDetails: (details) => dispatch({ type: 'SET_QUOTE_DETAILS', details }),
      submitQuote: () => {
        if (!state.quoteDraft.items.length) return undefined;
        const submittedAt = new Date().toISOString();
        const record: QuoteRecord = {
          id: generateQuoteId(),
          createdAt: state.quoteDraft.lastPrefillQuoteId ? state.quoteDraft.lastUpdatedAt : submittedAt,
          submittedAt,
          details: { ...state.quoteDraft.details },
          items: cloneLineItems(state.quoteDraft.items),
        };
        dispatch({ type: 'SUBMIT_QUOTE', record });
        return record;
      },
      prefillQuoteFromHistory: (quoteId) => {
        const record = state.quoteHistory.find((entry) => entry.id === quoteId);
        if (!record) return;
        dispatch({ type: 'PREFILL_QUOTE', record });
      },
    };
  }, [state]);

  return <StorefrontStateContext.Provider value={contextValue}>{children}</StorefrontStateContext.Provider>;
}

export function useStorefrontState() {
  const context = useContext(StorefrontStateContext);
  if (!context) {
    throw new Error('useStorefrontState must be used within a StorefrontProvider');
  }
  return context;
}
