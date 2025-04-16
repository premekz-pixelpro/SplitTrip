import { auth, db } from '../config/firebase.node.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface TestUser {
  email: string;
  password: string;
  displayName: string;
  image?: string;
}

interface FirestoreUser {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  image?: string;
  createdAt: Date;
  events: string[];  // ID eventów, w których uczestniczy
  preferences: {
    currency: string;
    language: string;
  };
}

const testUsers: TestUser[] = [
  { email: 'john@example.com', password: 'test123', displayName: 'John Doe', image: 'https://i.pravatar.cc/48?u=5435345' },
  { email: 'jane@example.com', password: 'test123', displayName: 'Jane Smith', image: 'https://i.pravatar.cc/48?u=97807889756' },
  { email: 'bob@example.com', password: 'test123', displayName: 'Bob Wilson', image: 'https://i.pravatar.cc/48?u=23421463467' },
];

const createUsers = async () => {
  for (const user of testUsers) {
    try {
      // 1. Stwórz użytkownika w Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        user.email, 
        user.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: user.displayName
      });

      // 2. Dodaj użytkownika do Firestore -- brak sprawdzenia, czy użytkownik już istnieje, trzeba dodać

      const firestoreUser: FirestoreUser = {
        uid: userCredential.user.uid,
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        image: user.image,
        createdAt: new Date(),
        events: [],
        preferences: {
          currency: 'PLN',
          language: 'pl'
        }
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), firestoreUser);

      console.log(`Created user in Auth and Firestore: ${user.email}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error creating user ${user.email}:`, error.message);
      }
    }
  }
};

// Execute the function
createUsers().catch((error) => {
  console.error('Failed to create users:', error);
  process.exit(1);
});