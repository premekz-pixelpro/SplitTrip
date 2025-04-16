import { db } from '../config/firebase.node.js';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

interface TestEvent {
  title: string;
  description: string;
  creatorId: string;
  participants: EventParticipant[];
}

interface EventParticipant {
  userId: string;
  displayName: string;
  balance: number;
}

const testEvents: TestEvent[] = [
  {
    title: "Francja Narty",
    description: "Zimowy wyjazd na narty do Francji",
    creatorId: "",
    participants: []
  },
  {
    title: "Skały FrankenJura",
    description: "Wspinanie w niemieckiej Jurze Frankońskiej",
    creatorId: "",
    participants: []
  }
];

const createEvents = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName
    }));

    const john = users.find(u => u.email === 'john@example.com');
    const jane = users.find(u => u.email === 'jane@example.com');
    const bob = users.find(u => u.email === 'bob@example.com');

    if (!john || !jane || !bob) {
      throw new Error('Could not find all required users');
    }

    // Set creators and participants with displayName and initial balance
    testEvents[0].creatorId = john.id;
    testEvents[0].participants = [
      { userId: john.id, displayName: john.displayName, balance: 0 },
      { userId: jane.id, displayName: jane.displayName, balance: 0 },
      { userId: bob.id, displayName: bob.displayName, balance: 0 }
    ];

    testEvents[1].creatorId = jane.id;
    testEvents[1].participants = [
      { userId: jane.id, displayName: jane.displayName, balance: 0 },
      { userId: bob.id, displayName: bob.displayName, balance: 0 }
    ];

    // Create events in Firestore
    for (const event of testEvents) {
      const eventData = {
        ...event,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalExpenses: 0,
        bills: []
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);
      console.log(`Created event: ${event.title} with ID: ${docRef.id}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating events:', error.message);
    }
  }
};

// Execute the function
createEvents().catch((error) => {
  console.error('Failed to create events:', error);
  process.exit(1);
});