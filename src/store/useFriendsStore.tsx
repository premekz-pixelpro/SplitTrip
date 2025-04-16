import { create } from 'zustand';
import { Friend } from '@/types/types';


type FriendsStore = {
    friends: Friend[];
    selectedFriend: Friend | null
    showAddFriend: boolean
    setFriends: (friends: Friend[]) => void
    addFriend: (friend: Friend) => void
    setSelectedFriend: (friend: Friend | null) => void

    selectFriend: (friend: Friend | null) => void
    setShowAddFriend: (show: boolean) => void
    updateFriendBalance: (id: string | number, newBalance: number) => void
  }

  export const useFriendsStore = create<FriendsStore>((set) => ({
    friends: [
      {
        id: "118836",
        name: "Clark",
        image: "https://i.pravatar.cc/48?u=118836",
        balance: -7,
      },
      {
        id: "933372",
        name: "Sarah",
        image: "https://i.pravatar.cc/48?u=933372",
        balance: 20,
      },
      {
        id: "499476",
        name: "Anthony",
        image: "https://i.pravatar.cc/48?u=499476",
        balance: 0,
      },
    ],
    selectedFriend: null,
    showAddFriend: false,
    setFriends: (friends) => set({ friends }),
    addFriend: (friend) => set((state) => ({ 
      friends: [...state.friends, friend],
      showAddFriend: false 
    })),
    selectFriend: (friend) => set({ 
      selectedFriend: friend,
      showAddFriend: false 
    }),
    setShowAddFriend: (show) => set({ showAddFriend: show }),
    updateFriendBalance: (id, newBalance) => set((state) => ({
      friends: state.friends.map((friend) =>
        friend.id === id ? { ...friend, balance: newBalance } : friend
      ),
      selectedFriend: null
    })),
    setSelectedFriend: (friend) => set({ selectedFriend: friend }),
  }))