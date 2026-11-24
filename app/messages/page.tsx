"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { auth, db } from "app/firebase/firebase";
import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import { Footer } from "app/components/Navigation/Footer";

type Conversation = {
  id: string;
  participants: string[];
  senderId: string;
  recipientId: string;
  status: "pending" | "accepted" | "declined";
  requestMessage: string;
  updatedAt: string;
};

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [allowMessages, setAllowMessages] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [requestText, setRequestText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const loadConversations = useCallback(async (uid: string) => {
    try {
      const inbox = query(
        collection(db, "conversations"),
        where("participants", "array-contains", uid)
      );
      const snapshot = await getDocs(inbox);
      setConversations(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as Conversation))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      );
    } catch (error) {
      console.error("Unable to load message requests:", error);
      setStatusMessage("Inbox could not be loaded.");
    }
  }, []);

  const loadMessages = useCallback(async (conversation: Conversation) => {
    if (conversation.status !== "accepted") {
      setMessages([]);
      return;
    }
    try {
      const snapshot = await getDocs(
        collection(db, "conversations", conversation.id, "messages")
      );
      setMessages(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as Message))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      );
    } catch (error) {
      console.error("Unable to load conversation messages:", error);
      setStatusMessage("Messages could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const targetMember = searchParams.get("to");
    if (targetMember) setRecipientId(targetMember);
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAllowMessages(false);
        setConversations([]);
        setSelected(null);
        return;
      }
      const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));
      setAllowMessages(userSnapshot.data()?.allowDirectMessages === true);
      await loadConversations(currentUser.uid);
    });
    return unsubscribe;
  }, [loadConversations]);

  useEffect(() => {
    if (selected) loadMessages(selected);
  }, [selected, loadMessages]);

  const toggleMessages = async (enabled: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        allowDirectMessages: enabled,
      });
      setAllowMessages(enabled);
      setStatusMessage(
        enabled
          ? "Message requests are enabled."
          : "Message requests are disabled."
      );
    } catch (error) {
      console.error("Unable to update messaging preference:", error);
      setStatusMessage("Messaging preference could not be updated.");
    }
  };

  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !allowMessages || !recipientId.trim() || !requestText.trim()) {
      setStatusMessage(
        "Enable messaging and provide a member ID and request message."
      );
      return;
    }
    if (recipientId === user.uid) {
      setStatusMessage("You cannot send a request to yourself.");
      return;
    }
    try {
      const recipient = await getDoc(doc(db, "users", recipientId.trim()));
      if (recipient.data()?.allowDirectMessages !== true) {
        setStatusMessage("That member is not accepting message requests.");
        return;
      }
      const participants = [user.uid, recipientId.trim()].sort();
      const conversationId = participants.join("__");
      const createdAt = new Date().toISOString();
      await setDoc(doc(db, "conversations", conversationId), {
        participants,
        senderId: user.uid,
        recipientId: recipientId.trim(),
        requestMessage: requestText.trim(),
        status: "pending",
        createdAt,
        updatedAt: createdAt,
      });
      setRecipientId("");
      setRequestText("");
      setStatusMessage("Message request sent.");
      await loadConversations(user.uid);
    } catch (error) {
      console.error("Unable to send message request:", error);
      setStatusMessage("Message request could not be sent.");
    }
  };

  const updateRequest = async (
    conversation: Conversation,
    decision: "accepted" | "declined"
  ) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "conversations", conversation.id), {
        status: decision,
        updatedAt: new Date().toISOString(),
      });
      const updated = { ...conversation, status: decision };
      setSelected(updated);
      await loadConversations(user.uid);
      setStatusMessage(
        decision === "accepted"
          ? "Message request accepted."
          : "Message request declined."
      );
    } catch (error) {
      console.error("Unable to update message request:", error);
      setStatusMessage("Message request could not be updated.");
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || selected?.status !== "accepted" || !messageText.trim()) return;
    try {
      const createdAt = new Date().toISOString();
      await addDoc(collection(db, "conversations", selected.id, "messages"), {
        senderId: user.uid,
        text: messageText.trim(),
        createdAt,
      });
      await updateDoc(doc(db, "conversations", selected.id), {
        updatedAt: createdAt,
      });
      setMessageText("");
      await loadMessages(selected);
      await loadConversations(user.uid);
    } catch (error) {
      console.error("Unable to send message:", error);
      setStatusMessage("Message could not be sent.");
    }
  };

  if (!user) {
    return (
      <>
        <LayoutNavbar />
        <main className="site-body min-h-[80vh] px-4 py-8 md:mx-auto md:w-[950px]">
          <p className="text-sh-grey">Sign in to use messages.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <LayoutNavbar />
      <main className="site-body min-h-[80vh] px-4 py-8 md:mx-auto md:w-[950px]">
        <h1 className="mb-5 text-3xl font-bold text-p-white">Messages</h1>
        <label className="flex items-center gap-2 text-sh-grey">
          <input
            type="checkbox"
            checked={allowMessages}
            onChange={(event) => toggleMessages(event.target.checked)}
          />
          Accept direct message requests
        </label>

        {allowMessages && (
          <form className="my-5 flex flex-col gap-2" onSubmit={createRequest}>
            <h2 className="font-bold text-p-white">Start a message request</h2>
            <input
              className="rounded bg-h-grey p-2 text-drop-black"
              aria-label="Recipient member ID"
              placeholder="Recipient member ID"
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
            />
            <textarea
              className="rounded bg-h-grey p-2 text-drop-black"
              aria-label="Request message"
              placeholder="Write a short message request"
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
            />
            <button
              className="w-fit rounded bg-hov-blue px-3 py-2 text-p-white"
              type="submit"
            >
              Send request
            </button>
          </form>
        )}

        {statusMessage && (
          <p role="status" className="my-3 text-sh-grey">
            {statusMessage}
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <section>
            <h2 className="mb-2 font-bold text-p-white">Inbox and requests</h2>
            {conversations.map((conversation) => {
              const isIncoming =
                conversation.status === "pending" &&
                conversation.recipientId === user.uid;
              const otherMember = conversation.participants.find(
                (uid) => uid !== user.uid
              );
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelected(conversation)}
                  className="block w-full border-b border-b-grey py-3 text-left text-sh-grey"
                >
                  <span className="block text-p-white">{otherMember}</span>
                  <span className="text-xs">
                    {isIncoming ? "Message request" : conversation.status}
                  </span>
                </button>
              );
            })}
            {conversations.length === 0 && (
              <p className="text-sm text-sh-grey">
                No conversations or requests yet.
              </p>
            )}
          </section>

          <section className="rounded bg-review-bg/30 p-4">
            {!selected && (
              <p className="text-sh-grey">Choose a conversation.</p>
            )}
            {selected?.status === "pending" && (
              <>
                <p className="text-sh-grey">{selected.requestMessage}</p>
                {selected.recipientId === user.uid && (
                  <div className="mt-4 flex gap-2">
                    <button
                      className="rounded bg-hov-blue px-3 py-2 text-p-white"
                      onClick={() => updateRequest(selected, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="rounded bg-c-grey px-3 py-2 text-p-white"
                      onClick={() => updateRequest(selected, "declined")}
                    >
                      Decline
                    </button>
                  </div>
                )}
                {selected.senderId === user.uid && (
                  <p className="mt-3 text-sm text-sh-grey">
                    Waiting for the recipient to accept.
                  </p>
                )}
              </>
            )}
            {selected?.status === "declined" && (
              <p className="text-sh-grey">This message request was declined.</p>
            )}
            {selected?.status === "accepted" && (
              <>
                <div className="mb-4 flex min-h-32 flex-col gap-2">
                  {messages.map((message) => (
                    <p
                      key={message.id}
                      className={`max-w-[85%] rounded p-2 text-sm ${
                        message.senderId === user.uid
                          ? "self-end bg-hov-blue text-p-white"
                          : "self-start bg-c-grey text-p-white"
                      }`}
                    >
                      {message.text}
                    </p>
                  ))}
                </div>
                <form className="flex gap-2" onSubmit={sendMessage}>
                  <input
                    className="min-w-0 flex-1 rounded bg-h-grey p-2 text-drop-black"
                    aria-label="Message"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                  />
                  <button
                    className="rounded bg-hov-blue px-3 text-p-white"
                    type="submit"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
