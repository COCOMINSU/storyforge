/**
 * 세계관 상태 관리 스토어
 *
 * 인물, 장소, 아이템 카드를 관리합니다.
 *
 * 주요 기능:
 * - 세계관 카드 CRUD
 * - 카드 검색 및 필터링
 * - 관계 관리
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '@/db';
import { generateId } from '@/lib';
import type {
  WorldCard,
  CharacterCard,
  LocationCard,
  ItemCard,
  CardType,
  CharacterRole,
} from '@/types';

interface WorldState {
  /** 인물 카드 목록 */
  characters: CharacterCard[];

  /** 장소 카드 목록 */
  locations: LocationCard[];

  /** 아이템 카드 목록 */
  items: ItemCard[];

  /** 현재 선택된 카드 */
  selectedCard: WorldCard | null;

  /** 로딩 상태 */
  isLoading: boolean;

  /** 필터 (현재 탭) */
  activeTab: CardType | 'all';

  /** 검색어 */
  searchQuery: string;
}

interface WorldActions {
  /** 프로젝트의 모든 세계관 카드 로드 */
  loadCards: (projectId: string) => Promise<void>;

  /** 카드 초기화 */
  clearCards: () => void;

  /** 카드 선택 */
  selectCard: (card: WorldCard | null) => void;

  /** 탭 변경 */
  setActiveTab: (tab: CardType | 'all') => void;

  /** 검색어 변경 */
  setSearchQuery: (query: string) => void;

  // === 인물 카드 ===
  /** 인물 카드 생성 */
  createCharacter: (
    projectId: string,
    data: Partial<CharacterCard>
  ) => Promise<CharacterCard>;
  /** 인물 카드 업데이트 */
  updateCharacter: (
    characterId: string,
    updates: Partial<CharacterCard>
  ) => Promise<void>;
  /** 인물 카드 삭제 */
  deleteCharacter: (characterId: string) => Promise<void>;

  // === 장소 카드 ===
  /** 장소 카드 생성 */
  createLocation: (
    projectId: string,
    data: Partial<LocationCard>
  ) => Promise<LocationCard>;
  /** 장소 카드 업데이트 */
  updateLocation: (
    locationId: string,
    updates: Partial<LocationCard>
  ) => Promise<void>;
  /** 장소 카드 삭제 */
  deleteLocation: (locationId: string) => Promise<void>;

  // === 아이템 카드 ===
  /** 아이템 카드 생성 */
  createItem: (projectId: string, data: Partial<ItemCard>) => Promise<ItemCard>;
  /** 아이템 카드 업데이트 */
  updateItem: (itemId: string, updates: Partial<ItemCard>) => Promise<void>;
  /** 아이템 카드 삭제 */
  deleteItem: (itemId: string) => Promise<void>;

  // === 유틸리티 ===
  /** 필터링된 카드 목록 가져오기 */
  getFilteredCards: () => WorldCard[];
  /** 이름으로 인물 찾기 */
  findCharacterByName: (name: string) => CharacterCard | undefined;
}

type WorldStore = WorldState & WorldActions;

/**
 * 세계관 스토어
 *
 * @example
 * const { characters, createCharacter } = useWorldStore();
 *
 * // 인물 생성
 * await createCharacter(projectId, {
 *   name: '주인공',
 *   role: 'protagonist',
 * });
 */
export const useWorldStore = create<WorldStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      characters: [],
      locations: [],
      items: [],
      selectedCard: null,
      isLoading: false,
      activeTab: 'all',
      searchQuery: '',

      // 카드 로드
      loadCards: async (projectId) => {
        set({ isLoading: true });

        try {
          const [characters, locations, items] = await Promise.all([
            db.characters.where('projectId').equals(projectId).toArray(),
            db.locations.where('projectId').equals(projectId).toArray(),
            db.items.where('projectId').equals(projectId).toArray(),
          ]);

          set({ characters, locations, items, isLoading: false });
        } catch (error) {
          console.error('[WorldStore] 카드 로드 실패:', error);
          set({ isLoading: false });
        }
      },

      // 카드 초기화
      clearCards: () => {
        set({
          characters: [],
          locations: [],
          items: [],
          selectedCard: null,
          activeTab: 'all',
          searchQuery: '',
        });
      },

      // 카드 선택
      selectCard: (card) => {
        set({ selectedCard: card });
      },

      // 탭 변경
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      // 검색어 변경
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // === 인물 카드 ===
      createCharacter: async (projectId, data) => {
        const now = new Date();

        const character: CharacterCard = {
          id: generateId(),
          projectId,
          type: 'character',
          name: data.name || '새 인물',
          description: data.description || '',
          tags: data.tags || [],
          basicInfo: data.basicInfo || {},
          appearance: data.appearance || {},
          personality: data.personality || '',
          background: data.background || '',
          motivation: data.motivation || '',
          abilities: data.abilities || [],
          relationships: data.relationships || [],
          arc: data.arc || [],
          role: data.role || ('supporting' as CharacterRole),
          firstAppearance: data.firstAppearance,
          imageUrl: data.imageUrl,
          createdAt: now,
          updatedAt: now,
        };

        await db.characters.add(character);
        set((state) => ({ characters: [...state.characters, character] }));

        return character;
      },

      updateCharacter: async (characterId, updates) => {
        const now = new Date();
        await db.characters.update(characterId, { ...updates, updatedAt: now });

        set((state) => {
          const updatedCharacters = state.characters.map((c) =>
            c.id === characterId ? { ...c, ...updates, updatedAt: now } : c
          );

          let updatedSelectedCard = state.selectedCard;
          if (state.selectedCard?.id === characterId && state.selectedCard.type === 'character') {
            updatedSelectedCard = { ...state.selectedCard, ...updates, updatedAt: now } as CharacterCard;
          }

          return {
            characters: updatedCharacters,
            selectedCard: updatedSelectedCard,
          };
        });
      },

      deleteCharacter: async (characterId) => {
        await db.characters.delete(characterId);

        set((state) => ({
          characters: state.characters.filter((c) => c.id !== characterId),
          selectedCard:
            state.selectedCard?.id === characterId ? null : state.selectedCard,
        }));
      },

      // === 장소 카드 ===
      createLocation: async (projectId, data) => {
        const now = new Date();

        const location: LocationCard = {
          id: generateId(),
          projectId,
          type: 'location',
          name: data.name || '새 장소',
          description: data.description || '',
          tags: data.tags || [],
          locationType: data.locationType || '',
          region: data.region,
          features: data.features || '',
          atmosphere: data.atmosphere || '',
          significance: data.significance || '',
          relatedCharacters: data.relatedCharacters || [],
          relatedEvents: data.relatedEvents,
          imageUrl: data.imageUrl,
          createdAt: now,
          updatedAt: now,
        };

        await db.locations.add(location);
        set((state) => ({ locations: [...state.locations, location] }));

        return location;
      },

      updateLocation: async (locationId, updates) => {
        const now = new Date();
        await db.locations.update(locationId, { ...updates, updatedAt: now });

        set((state) => {
          const updatedLocations = state.locations.map((l) =>
            l.id === locationId ? { ...l, ...updates, updatedAt: now } : l
          );

          let updatedSelectedCard = state.selectedCard;
          if (state.selectedCard?.id === locationId && state.selectedCard.type === 'location') {
            updatedSelectedCard = { ...state.selectedCard, ...updates, updatedAt: now } as LocationCard;
          }

          return {
            locations: updatedLocations,
            selectedCard: updatedSelectedCard,
          };
        });
      },

      deleteLocation: async (locationId) => {
        await db.locations.delete(locationId);

        set((state) => ({
          locations: state.locations.filter((l) => l.id !== locationId),
          selectedCard:
            state.selectedCard?.id === locationId ? null : state.selectedCard,
        }));
      },

      // === 아이템 카드 ===
      createItem: async (projectId, data) => {
        const now = new Date();

        const item: ItemCard = {
          id: generateId(),
          projectId,
          type: 'item',
          name: data.name || '새 아이템',
          description: data.description || '',
          tags: data.tags || [],
          itemType: data.itemType || '',
          rarity: data.rarity,
          properties: data.properties || '',
          origin: data.origin || '',
          currentOwner: data.currentOwner,
          significance: data.significance || '',
          imageUrl: data.imageUrl,
          createdAt: now,
          updatedAt: now,
        };

        await db.items.add(item);
        set((state) => ({ items: [...state.items, item] }));

        return item;
      },

      updateItem: async (itemId, updates) => {
        const now = new Date();
        await db.items.update(itemId, { ...updates, updatedAt: now });

        set((state) => {
          const updatedItems = state.items.map((i) =>
            i.id === itemId ? { ...i, ...updates, updatedAt: now } : i
          );

          let updatedSelectedCard = state.selectedCard;
          if (state.selectedCard?.id === itemId && state.selectedCard.type === 'item') {
            updatedSelectedCard = { ...state.selectedCard, ...updates, updatedAt: now } as ItemCard;
          }

          return {
            items: updatedItems,
            selectedCard: updatedSelectedCard,
          };
        });
      },

      deleteItem: async (itemId) => {
        await db.items.delete(itemId);

        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
          selectedCard:
            state.selectedCard?.id === itemId ? null : state.selectedCard,
        }));
      },

      // === 유틸리티 ===
      getFilteredCards: () => {
        const { characters, locations, items, activeTab, searchQuery } = get();

        let cards: WorldCard[] = [];

        switch (activeTab) {
          case 'character':
            cards = characters;
            break;
          case 'location':
            cards = locations;
            break;
          case 'item':
            cards = items;
            break;
          default:
            cards = [...characters, ...locations, ...items];
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          cards = cards.filter(
            (card) =>
              card.name.toLowerCase().includes(query) ||
              card.description.toLowerCase().includes(query) ||
              card.tags.some((tag) => tag.toLowerCase().includes(query))
          );
        }

        return cards;
      },

      findCharacterByName: (name) => {
        const { characters } = get();
        return characters.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
      },
    }),
    { name: 'WorldStore' }
  )
);
