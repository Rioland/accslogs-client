"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Ticket,
  Plus,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Sidebar from "../Sidebar";
import TopBar from "@/app/components/TopBar";
import Navbar1 from "@/app/components/Navbar1";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

const Navbar2 = dynamic(() => import("@/app/components/Navbar2"), {
  ssr: false,
});

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

interface TicketItem {
  id: number;
  user_id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
  order_id: number | null;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

interface Order {
  id: number;
  seller_products: { name: string } | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Badge helpers                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: TicketItem["status"] }) {
  const map: Record<
    TicketItem["status"],
    { cls: string; label: string; icon: React.ReactNode }
  > = {
    open: {
      cls: "bg-blue-100 text-blue-700 border-blue-300",
      label: "Open",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    in_progress: {
      cls: "bg-yellow-100 text-yellow-700 border-yellow-300",
      label: "In Progress",
      icon: <Clock className="h-3 w-3" />,
    },
    closed: {
      cls: "bg-green-100 text-green-700 border-green-300",
      label: "Closed",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  };
  const { cls, label, icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketItem["priority"] }) {
  const map: Record<TicketItem["priority"], string> = {
    low: "bg-gray-100 text-gray-600 border-gray-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    high: "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[priority]}`}
    >
      {priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Ticket Card                                                         */
/* ------------------------------------------------------------------ */

function TicketCard({
  ticket,
  userId,
  onStatusChange,
}: {
  ticket: TicketItem;
  userId: string;
  onStatusChange: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    setLoadingMessages(false);
  }, [ticket.id]);

  const handleExpand = () => {
    if (!expanded) fetchMessages();
    setExpanded((v) => !v);
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: userId,
      message: replyText.trim(),
      is_admin_reply: false,
    });
    setReplyText("");
    await fetchMessages();
    setSending(false);
  };

  const closeTicket = async () => {
    setClosing(true);
    await supabase
      .from("tickets")
      .update({ status: "closed" })
      .eq("id", ticket.id);
    setClosing(false);
    onStatusChange();
  };

  const formattedDate = new Date(ticket.created_at).toLocaleDateString(
    "en-NG",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              #{ticket.id} — {ticket.subject}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {ticket.description}
        </p>
        {ticket.order_id && (
          <p className="mt-2 text-xs text-gray-500">
            Linked Order:{" "}
            <span className="font-medium text-gray-700">
              #{ticket.order_id}
            </span>
          </p>
        )}
      </div>

      {/* Thread toggle */}
      <div className="border-t border-gray-100">
        <button
          onClick={handleExpand}
          className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            View Thread
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">
            {/* Messages */}
            {loadingMessages ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Loading messages…
              </p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No replies yet. Start the conversation below.
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin_reply ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                        msg.is_admin_reply
                          ? "bg-gray-100 text-gray-800 rounded-tl-none"
                          : "bg-amber-500 text-white rounded-tr-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.is_admin_reply
                            ? "text-gray-400"
                            : "text-amber-100"
                        }`}
                      >
                        {msg.is_admin_reply ? "Support" : "You"} ·{" "}
                        {new Date(msg.created_at).toLocaleTimeString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply box — only if ticket is not closed */}
            {ticket.status !== "closed" && (
              <div className="flex gap-2 pt-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply…"
                  rows={2}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="self-end inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            )}

            {/* Close ticket button */}
            {ticket.status !== "closed" && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={closeTicket}
                  disabled={closing}
                  className="text-xs text-gray-500 hover:text-red-600 underline transition-colors disabled:opacity-50"
                >
                  {closing ? "Closing…" : "Mark as Closed"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Ticket Modal                                                 */
/* ------------------------------------------------------------------ */

function CreateTicketModal({
  onClose,
  onCreated,
  userId,
  orders,
}: {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
  orders: Order[];
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Subject and description are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("tickets").insert({
      user_id: userId,
      subject: subject.trim(),
      description: description.trim(),
      priority: "medium",
      order_id: orderId ? parseInt(orderId) : null,
    });

    if (insertError) {
      setError("Failed to create ticket. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-amber-500" />
            Create New Ticket
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail…"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <span className="font-medium">Medium</span>
              <span className="text-amber-500 text-xs">
                (default — support may adjust)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Order{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              <option value="">— No specific order —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  Order #{o.id}
                  {o.seller_products?.name
                    ? ` — ${o.seller_products.name}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2 text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Creating…" : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "in_progress" | "closed"
  >("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const [ticketsRes, ordersRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("product_orders")
          .select("id, created_at, seller_products(name)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!cancelled) {
        setUserId(session.user.id);
        setTickets(ticketsRes.data ?? []);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (ordersRes.data ?? []).map((o: any) => ({
          ...o,
          seller_products: Array.isArray(o.seller_products)
            ? (o.seller_products[0] ?? null)
            : o.seller_products,
        }));
        setOrders(mapped);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router, refreshKey]);

  const handleSidebarChange = async (key: string) => {
    if (key === "sign-out") {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  const filteredTickets =
    statusFilter === "all"
      ? tickets
      : tickets.filter((t) => t.status === statusFilter);

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={() => {}} />

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-[backdrop-filter]:bg-[#e4e9ee]/60">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm active:scale-[0.98]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
          <span className="text-base font-semibold text-gray-900">Tickets</span>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        {/* Sidebar: desktop */}
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey="tickets" onChange={handleSidebarChange} />
        </div>

        {/* Sidebar: mobile off-canvas */}
        {mobileOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] p-2">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black/10 h-full overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-base font-semibold text-gray-900">
                    Menu
                  </span>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar
                    activeKey="tickets"
                    onChange={(key) => {
                      handleSidebarChange(key);
                      setMobileOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Ticket className="h-6 w-6 text-amber-500" />
              My Tickets
            </h1>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </button>
          </div>

          {/* Stats bar */}
          {!loading && tickets.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] px-5 py-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total:</span>
                <span className="font-semibold text-gray-800">
                  {tickets.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Open:</span>
                <span className="font-semibold text-blue-600">{openCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">In Progress:</span>
                <span className="font-semibold text-yellow-600">
                  {inProgressCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Closed:</span>
                <span className="font-semibold text-green-600">
                  {closedCount}
                </span>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          {!loading && tickets.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {(["all", "open", "in_progress", "closed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors capitalize ${
                    statusFilter === f
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-amber-400 hover:text-amber-600"
                  }`}
                >
                  {f === "in_progress"
                    ? "In Progress"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-10 flex flex-col items-center gap-3 text-gray-500">
              <svg
                className="animate-spin h-8 w-8 text-amber-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <p className="text-sm">Loading your tickets…</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && tickets.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-10 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                <Ticket className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  No tickets yet
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Having an issue? Create a support ticket and our team will
                  help you.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Your First Ticket
              </button>
            </div>
          )}

          {/* Filtered empty state */}
          {!loading && tickets.length > 0 && filteredTickets.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-8 text-center text-gray-500">
              <p className="text-sm">
                No tickets with status &ldquo;{statusFilter}&rdquo;.
              </p>
            </div>
          )}

          {/* Ticket list */}
          {!loading && filteredTickets.length > 0 && (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  userId={userId}
                  onStatusChange={triggerRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Create ticket modal */}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={triggerRefresh}
          userId={userId}
          orders={orders}
        />
      )}
    </div>
  );
}
