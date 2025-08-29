import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getUserSubscription,
  updateUserSubscription,
  incrementUserQuizCount,
  resetUserQuizCount,
} from "../firebase/firestore";

// Create the context
const SubscriptionContext = createContext();

// Custom hook to use the subscription context
export function useSubscription() {
  return useContext(SubscriptionContext);
}

// Define subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
};

// Define features available for each plan
export const PLAN_FEATURES = {
  [SUBSCRIPTION_PLANS.FREE]: {
    quizLimit: 3, // 3 quizzes per day
    questionsPerQuiz: 5, // 5 questions per quiz
    analytics: false, // No advanced analytics
    explanations: false, // No detailed explanations
    topics: 5, // Limited topics
  },
  [SUBSCRIPTION_PLANS.BASIC]: {
    quizLimit: 10, // 10 quizzes per day
    questionsPerQuiz: 10, // 10 questions per quiz
    analytics: true, // Basic analytics
    explanations: false, // No detailed explanations
    topics: 10, // More topics
  },
  [SUBSCRIPTION_PLANS.PREMIUM]: {
    quizLimit: Infinity, // Unlimited quizzes
    questionsPerQuiz: 20, // Up to 20 questions per quiz
    analytics: true, // Advanced analytics
    explanations: true, // Detailed explanations
    topics: Infinity, // All topics
  },
};

export function SubscriptionProvider({ children }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState({
    plan: SUBSCRIPTION_PLANS.FREE,
    features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
    quizCount: 0,
    lastQuizDate: null,
  });

  // Load subscription data from Firestore when user changes
  useEffect(() => {
    const loadSubscription = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const userSubscription = await getUserSubscription(currentUser.uid);
          if (userSubscription) {
            const plan = userSubscription.plan || SUBSCRIPTION_PLANS.FREE;
            setSubscription({
              plan,
              features: PLAN_FEATURES[plan],
              quizCount: userSubscription.quizCount || 0,
              lastQuizDate: userSubscription.lastQuizDate
                ? new Date(userSubscription.lastQuizDate.toDate())
                : null,
            });
          }
          setLoading(false);
        } catch (error) {
          console.error("Error loading subscription data:", error);
          setLoading(false);
        }
      } else {
        setSubscription({
          plan: SUBSCRIPTION_PLANS.FREE,
          features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
          quizCount: 0,
          lastQuizDate: null,
        });
        setLoading(false);
      }
    };

    loadSubscription();
  }, [currentUser]);

  // Reset quiz count at midnight
  useEffect(() => {
    const checkDate = async () => {
      if (!currentUser) return;

      const today = new Date().toDateString();
      const lastQuizDate = subscription.lastQuizDate
        ? new Date(subscription.lastQuizDate).toDateString()
        : null;

      if (lastQuizDate && lastQuizDate !== today) {
        try {
          await resetUserQuizCount(currentUser.uid);
          setSubscription((prev) => ({
            ...prev,
            quizCount: 0,
          }));
        } catch (error) {
          console.error("Error resetting quiz count:", error);
        }
      }
    };

    // Check on mount and set up daily check
    checkDate();
    const interval = setInterval(checkDate, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [subscription.lastQuizDate, currentUser]);

  // Check if user can take another quiz based on their plan
  const canTakeQuiz = () => {
    return subscription.quizCount < subscription.features.quizLimit;
  };

  // Increment quiz count when user takes a quiz
  const incrementQuizCount = async () => {
    if (!currentUser) return false;

    try {
      await incrementUserQuizCount(currentUser.uid);
      setSubscription((prev) => ({
        ...prev,
        quizCount: prev.quizCount + 1,
        lastQuizDate: new Date(),
      }));

      return true;
    } catch (error) {
      console.error("Error incrementing quiz count:", error);
      return false;
    }
  };

  // Upgrade subscription plan
  const upgradePlan = async (newPlan, expiryDate) => {
    if (!currentUser) return false;
    if (!Object.values(SUBSCRIPTION_PLANS).includes(newPlan)) return false;

    try {
      const updatedSubscription = {
        plan: newPlan,
        expiresAt: expiryDate,
      };

      await updateUserSubscription(currentUser.uid, updatedSubscription);

      setSubscription({
        plan: newPlan,
        features: PLAN_FEATURES[newPlan],
        quizCount: subscription.quizCount,
        lastQuizDate: subscription.lastQuizDate,
      });

      return true;
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      return false;
    }
  };

  const value = {
    subscription,
    loading,
    canTakeQuiz,
    incrementQuizCount,
    upgradePlan,
    SUBSCRIPTION_PLANS,
    PLAN_FEATURES,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {!loading && children}
    </SubscriptionContext.Provider>
  );
}
