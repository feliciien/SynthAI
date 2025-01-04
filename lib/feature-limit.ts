import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { FREE_LIMITS, FEATURE_TYPES } from "@/constants";
import { checkSubscription } from "@/lib/subscription";
import type { PrismaClient } from '@prisma/client/edge';
import { authOptions } from "@/auth";

type FeatureType = typeof FEATURE_TYPES[keyof typeof FEATURE_TYPES];
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

interface DatabaseError extends Error {
  code?: string;
}

const handleError = (error: unknown, context: string) => {
  const dbError = error as DatabaseError;
  console.error(`[${context}] Error:`, {
    code: dbError.code || 'UNKNOWN',
    message: dbError.message || 'An unknown error occurred',
    timestamp: new Date().toISOString(),
    stack: dbError.stack
  });
};

export const incrementFeatureUsage = async (featureType: FeatureType): Promise<void> => {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      console.log("[INCREMENT_FEATURE] No user ID found");
      return;
    }

    await db.$transaction(async (prisma: TransactionClient) => {
      const userFeatureUsage = await prisma.userFeatureUsage.findUnique({
        where: {
          userId_featureType: {
            userId,
            featureType
          }
        },
      });

      if (userFeatureUsage) {
        await prisma.userFeatureUsage.update({
          where: {
            userId_featureType: {
              userId,
              featureType
            }
          },
          data: {
            count: userFeatureUsage.count + 1,
          },
        });
      } else {
        await prisma.userFeatureUsage.create({
          data: {
            userId,
            featureType,
            count: 1,
          },
        });
      }

      console.log("[INCREMENT_FEATURE] Updated usage:", {
        userId,
        featureType,
        newCount: userFeatureUsage ? userFeatureUsage.count + 1 : 1,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    handleError(error, 'INCREMENT_FEATURE_USAGE');
  }
};

export const checkFeatureLimit = async (featureType: FeatureType): Promise<boolean> => {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      console.log("[CHECK_FEATURE_LIMIT] No user ID found");
      return false;
    }

    const isPro = await checkSubscription();
    if (isPro) {
      console.log("[CHECK_FEATURE_LIMIT] Pro user, no limits:", {
        userId,
        featureType,
        timestamp: new Date().toISOString()
      });
      return true;
    }

    const usage = await getFeatureUsage(featureType);
    const limit = FREE_LIMITS[featureType];

    if (typeof limit === 'undefined') {
      console.error("[CHECK_FEATURE_LIMIT] No limit defined for feature:", {
        featureType,
        availableLimits: Object.keys(FREE_LIMITS),
        timestamp: new Date().toISOString()
      });
      return false;
    }

    const hasAvailableUsage = usage < limit;
    console.log("[CHECK_FEATURE_LIMIT] Usage check:", {
      userId,
      featureType,
      currentUsage: usage,
      limit,
      hasAvailableUsage,
      timestamp: new Date().toISOString()
    });

    return hasAvailableUsage;
  } catch (error) {
    handleError(error, 'CHECK_FEATURE_LIMIT');
    return false;
  }
};

export const getFeatureUsage = async (featureType: FeatureType): Promise<number> => {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      console.log("[GET_FEATURE_USAGE] No user ID found");
      return 0;
    }

    const usage = await db.userFeatureUsage.findUnique({
      where: {
        userId_featureType: {
          userId,
          featureType
        }
      },
    });

    console.log("[GET_FEATURE_USAGE] Current usage:", {
      userId,
      featureType,
      count: usage?.count || 0,
      timestamp: new Date().toISOString()
    });

    return usage?.count || 0;
  } catch (error) {
    handleError(error, 'GET_FEATURE_USAGE');
    return 0;
  }
};
