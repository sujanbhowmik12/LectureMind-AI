import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDFJxsjgVIX9puOaCm1rW2DWZr6m1Kv1Gs",
  authDomain: "lecturemind-4829b.firebaseapp.com",
  projectId: "lecturemind-4829b",
  storageBucket: "lecturemind-4829b.firebasestorage.app",
  messagingSenderId: "126743474950",
  appId: "1:126743474950:web:e71d4cebd81a4590d2e487",
  measurementId: "G-QJ8BTEGH66"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign In
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// Email & Password Registration
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return result.user;
  } catch (error) {
    console.error("Email Registration Error:", error);
    throw error;
  }
};

// Email & Password Sign In
export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email Login Error:", error);
    throw error;
  }
};

// Sign Out
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};
