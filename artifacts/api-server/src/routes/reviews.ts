import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reviewsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

// GET /reviews - Fetch latest 10 reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await db
      .select({
        id: reviewsTable.id,
        role: reviewsTable.role,
        text: reviewsTable.text,
        score: reviewsTable.score,
        createdAt: reviewsTable.createdAt,
        user: {
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          profileImageUrl: usersTable.profileImageUrl,
        },
      })
      .from(reviewsTable)
      .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(10);

    // Map to the expected API schema
    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      name: `${r.user.firstName || ""} ${r.user.lastName || ""}`.trim() || "Anonymous",
      role: r.role,
      text: r.text,
      score: r.score,
      createdAt: r.createdAt.toISOString(),
      profileImageUrl: r.user.profileImageUrl || undefined,
    }));

    res.json(formattedReviews);
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /reviews - Create a new review
router.post("/reviews", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { role, text, score } = req.body;
  
  if (!role || !text || score == null || score < 0 || score > 100) {
    res.status(400).json({ error: "Invalid review payload" });
    return;
  }

  try {
    const [review] = await db
      .insert(reviewsTable)
      .values({
        userId: req.user.id,
        role,
        text,
        score,
      })
      .returning();

    res.status(201).json({
      id: review.id,
      name: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || "Anonymous",
      role: review.role,
      text: review.text,
      score: review.score,
      createdAt: review.createdAt.toISOString(),
      profileImageUrl: req.user.profileImageUrl || undefined,
    });
  } catch (err) {
    console.error("Failed to create review:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;
