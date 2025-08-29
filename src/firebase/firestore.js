import { db } from "./config";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

// Collection references
const usersCollection = "users";
const quizzesCollection = "quizzes";

// User-related operations
export const createUserDocument = async (user) => {
  if (!user) return;

  const userRef = doc(db, usersCollection, user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { email, displayName, photoURL } = user;

    try {
      // Create the document with setDoc since it's a new document
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: displayName || email.split("@")[0],
        photoURL: photoURL || null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        subscription: {
          plan: "FREE",
          startDate: serverTimestamp(),
          endDate: null,
          quizCount: 0,
          lastQuizDate: null,
        },
      });
      console.log("User document created successfully");
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  } else {
    // Update last login time for existing user
    try {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }
};

// Quiz-related operations
export const saveQuizResult = async (userId, quizData) => {
  if (!userId || !quizData) return;

  try {
    // Add timestamp to quiz data
    const quizWithTimestamp = {
      ...quizData,
      userId,
      timestamp: serverTimestamp(),
    };

    // Add to quizzes collection
    await addDoc(collection(db, quizzesCollection), quizWithTimestamp);

    console.log("Quiz result saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    return false;
  }
};

// Subscription-related operations
export const getUserSubscription = async (userId) => {
  if (!userId) return null;

  try {
    const userRef = doc(db, usersCollection, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return (
        userData.subscription || {
          plan: "FREE",
          startDate: serverTimestamp(),
          endDate: null,
          quizCount: 0,
          lastQuizDate: null,
        }
      );
    }
    return null;
  } catch (error) {
    console.error("Error getting user subscription:", error);
    return null;
  }
};

export const updateUserSubscription = async (userId, subscriptionData) => {
  if (!userId || !subscriptionData) return false;

  try {
    const userRef = doc(db, usersCollection, userId);
    await updateDoc(userRef, {
      subscription: subscriptionData,
    });
    return true;
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return false;
  }
};

export const incrementUserQuizCount = async (userId) => {
  if (!userId) return false;

  try {
    const userRef = doc(db, usersCollection, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const subscription = userData.subscription || {
        plan: "FREE",
        startDate: serverTimestamp(),
        endDate: null,
        quizCount: 0,
        lastQuizDate: null,
      };

      // Increment quiz count and update last quiz date
      subscription.quizCount += 1;
      subscription.lastQuizDate = serverTimestamp();

      await updateDoc(userRef, { subscription });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error incrementing user quiz count:", error);
    return false;
  }
};

export const resetUserQuizCount = async (userId) => {
  if (!userId) return false;

  try {
    const userRef = doc(db, usersCollection, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.subscription) {
        userData.subscription.quizCount = 0;
        await updateDoc(userRef, {
          "subscription.quizCount": 0,
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error resetting user quiz count:", error);
    return false;
  }
};

export const getUserQuizHistory = async (userId, limitCount = 10) => {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, quizzesCollection),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const quizzes = [];

    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return quizzes;
  } catch (error) {
    console.error("Error getting user quiz history:", error);
    return [];
  }
};

export const getUserStats = async (userId) => {
  if (!userId) return null;

  try {
    // Get all user quizzes
    const q = query(
      collection(db, quizzesCollection),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const quizzes = [];

    querySnapshot.forEach((doc) => {
      quizzes.push(doc.data());
    });

    if (quizzes.length === 0) {
      return {
        totalQuizzes: 0,
        totalQuestions: 0,
        averageScore: 0,
        topTopics: [],
      };
    }

    // Calculate statistics
    const totalQuizzes = quizzes.length;
    const totalQuestions = quizzes.reduce(
      (sum, quiz) => sum + quiz.totalQuestions,
      0
    );
    const totalScore = quizzes.reduce((sum, quiz) => sum + quiz.percentage, 0);
    const averageScore = Math.round(totalScore / totalQuizzes);

    // Get top topics
    const topicMap = {};
    quizzes.forEach((quiz) => {
      if (!topicMap[quiz.topic]) {
        topicMap[quiz.topic] = {
          name: quiz.topic,
          count: 0,
          totalScore: 0,
        };
      }

      topicMap[quiz.topic].count += 1;
      topicMap[quiz.topic].totalScore += quiz.percentage;
    });

    const topTopics = Object.values(topicMap)
      .map((topic) => ({
        name: topic.name,
        score: Math.round(topic.totalScore / topic.count),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Get top 5 topics

    return {
      totalQuizzes,
      totalQuestions,
      averageScore,
      topTopics,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return null;
  }
};

// All duplicate code has been removed

// This is a duplicate function that was removed

// The getUserStats function is already defined above
