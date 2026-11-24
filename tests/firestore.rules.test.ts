import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const draft = (uid: string) => ({
  id: `${uid}_movie_42__`,
  uid,
  userName: "Member",
  userURL: "",
  content: { contentType: "movie", tmdbId: 42, title: "Film" },
  contentKey: "movie_42__",
  review: "A thoughtful review.",
  rating: 4.5,
  dimensions: { story: 4, craft: 5 },
  status: "draft",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "kraken-boxd-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore review rules", () => {
  it("keeps drafts private to their owner and prevents client publication", async () => {
    const owner = testEnv.authenticatedContext("author").firestore();
    const otherMember = testEnv.authenticatedContext("reader").firestore();
    const reviewRef = doc(owner, "reviews", "author_movie_42__");

    await assertSucceeds(setDoc(reviewRef, draft("author")));
    await assertSucceeds(getDoc(reviewRef));
    await assertFails(getDoc(doc(otherMember, "reviews", "author_movie_42__")));
    await assertFails(
      updateDoc(reviewRef, {
        status: "published",
        publishedAt: "2026-01-02T00:00:00Z",
      })
    );
    await assertFails(
      updateDoc(
        doc(
          testEnv
            .authenticatedContext("author", { verifiedCritic: true })
            .firestore(),
          "reviews",
          "author_movie_42__"
        ),
        {
          status: "scheduled",
          scheduledAt: "2026-01-03T00:00:00Z",
        }
      )
    );
  });

  it("allows public queries for published reviews only", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "reviews", "author_movie_42__"), {
        ...draft("author"),
        status: "published",
      });
    });

    const publicDb = testEnv.unauthenticatedContext().firestore();
    const published = query(
      collection(publicDb, "reviews"),
      where("status", "==", "published")
    );
    const result = await assertSucceeds(getDocs(published));
    expect(result.size).toBe(1);
    await assertSucceeds(getDoc(doc(publicDb, "reviews", "author_movie_42__")));
    const authorDb = testEnv.authenticatedContext("author").firestore();
    await assertSucceeds(
      deleteDoc(doc(authorDb, "reviews", "author_movie_42__"))
    );
  });

  it("protects the verified-critic profile field from client edits", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users", "author"), {
        uid: "author",
        allowDirectMessages: true,
      });
    });
    const owner = testEnv.authenticatedContext("author").firestore();
    await assertFails(
      updateDoc(doc(owner, "users", "author"), { verifiedCritic: true })
    );
  });
});

describe("Firestore message rules", () => {
  it("requires both members to opt in and restricts requests and messages to participants", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "users", "alice"), {
        allowDirectMessages: true,
      });
      await setDoc(doc(adminDb, "users", "bob"), { allowDirectMessages: true });
      await setDoc(doc(adminDb, "users", "mallory"), {
        allowDirectMessages: true,
      });
    });

    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    const bobDb = testEnv.authenticatedContext("bob").firestore();
    const malloryDb = testEnv.authenticatedContext("mallory").firestore();
    const conversation = {
      participants: ["alice", "bob"],
      senderId: "alice",
      recipientId: "bob",
      requestMessage: "Would you like to chat about this show?",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    await assertSucceeds(
      setDoc(doc(aliceDb, "conversations", "alice__bob"), conversation)
    );
    await assertSucceeds(getDoc(doc(bobDb, "conversations", "alice__bob")));
    await assertFails(getDoc(doc(malloryDb, "conversations", "alice__bob")));
    await assertSucceeds(
      updateDoc(doc(bobDb, "conversations", "alice__bob"), {
        status: "accepted",
        updatedAt: "2026-01-01T00:01:00.000Z",
      })
    );
    await assertSucceeds(
      addDoc(collection(aliceDb, "conversations", "alice__bob", "messages"), {
        senderId: "alice",
        text: "Hello",
        createdAt: "2026-01-01T00:02:00.000Z",
      })
    );
    await assertFails(
      addDoc(collection(malloryDb, "conversations", "alice__bob", "messages"), {
        senderId: "mallory",
        text: "Intruding",
        createdAt: "2026-01-01T00:03:00.000Z",
      })
    );
  });
});
