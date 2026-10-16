/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Loader2,
  CheckCircle2,
  Trophy,
  Ticket,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../Sidebar";
import Navbar1 from "../../components/Navbar1";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import supabaseClient from "@/lib/supabaseClient";
import { notifyFundsChanged } from "@/lib/fundsEvents";
import {
  type Beneficiary,
  type BeneficiaryInput,
  type RecentRecipient,
  beneficiaryKey,
  deleteBeneficiary,
  listBeneficiaries,
  listRecentRecipients,
  saveBeneficiary,
} from "@/lib/billBeneficiaries";
import { BeneficiaryPicker, SaveBeneficiaryToggle } from "./BeneficiaryPicker";

type TabKey = "airtime" | "data" | "electricity" | "tv" | "betting" | "epins";

type Epin = {
  amount?: string;
  pin?: string;
  serial?: string;
  instruction?: string;
};

type Variation = {
  variation_id: number | string;
  service_id: string;
  service_name?: string;
  data_plan?: string;
  package_bouquet?: string;
  price: string | number;
  availability?: string;
};

type BillRow = {
  id: number;
  product_type: string;
  service_id: string;
  customer_id: string | null;
  amount: number;
  status: string;
  provider_token: string | null;
  created_at: string;
};

const NETWORKS = [
  { id: "mtn", label: "MTN" },
  { id: "glo", label: "Glo" },
  { id: "airtel", label: "Airtel" },
  { id: "9mobile", label: "9mobile" },
];

const DATA_NETWORKS = [...NETWORKS, { id: "smile", label: "Smile" }];

const DISCOS = [
  { id: "ikeja-electric", label: "Ikeja (IKEDC)" },
  { id: "eko-electric", label: "Eko (EKEDC)" },
  { id: "abuja-electric", label: "Abuja (AEDC)" },
  { id: "ibadan-electric", label: "Ibadan (IBEDC)" },
  { id: "enugu-electric", label: "Enugu (EEDC)" },
  { id: "portharcourt-electric", label: "Port Harcourt (PHED)" },
  { id: "kaduna-electric", label: "Kaduna (KAEDCO)" },
  { id: "kano-electric", label: "Kano (KEDCO)" },
  { id: "jos-electric", label: "Jos (JED)" },
  { id: "benin-electric", label: "Benin (BEDC)" },
  { id: "aba-electric", label: "Aba (ABEDC)" },
  { id: "yola-electric", label: "Yola (YEDC)" },
];

const TV_PROVIDERS = [
  { id: "dstv", label: "DStv" },
  { id: "gotv", label: "GOtv" },
  { id: "startimes", label: "Startimes" },
  { id: "showmax", label: "Showmax" },
];

// Casing matters: eBills rejects a lowercased betting service_id.
// LiveScoreBet is omitted — the biller is not provisioned upstream.
const BETTING_PROVIDERS = [
  "1xBet",
  "BangBet",
  "Bet9ja",
  "BetKing",
  "BetLand",
  "BetLion",
  "BetWay",
  "CloudBet",
  "MerryBet",
  "NaijaBet",
  "NairaBet",
  "SportyBet",
  "SupaBet",
];

/** SportyBet identifies customers by phone number, not an account ID. */
const BETTING_USES_PHONE = new Set(["SportyBet"]);

const BETTING_MIN = 100;
const BETTING_MAX = 100000;

const EPIN_NETWORKS = NETWORKS;
const EPIN_VALUES = [100, 200, 500];
const EPIN_MAX_QTY = 40;

const TABS: { key: TabKey; label: string; icon: typeof Smartphone }[] = [
  { key: "airtime", label: "Airtime", icon: Smartphone },
  { key: "data", label: "Data", icon: Wifi },
  { key: "electricity", label: "Electricity", icon: Zap },
  { key: "tv", label: "Cable TV", icon: Tv },
  { key: "betting", label: "Betting", icon: Trophy },
  { key: "epins", label: "ePINs", icon: Ticket },
];

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F87D1F] bg-white text-gray-900";

/** Providers offered on each tab, as [id, label] — used to label chips. */
const SERVICE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  airtime: NETWORKS,
  data: DATA_NETWORKS,
  electricity: DISCOS,
  tv: TV_PROVIDERS,
  betting: BETTING_PROVIDERS.map((p) => ({ id: p, label: p })),
};

/** Max unsaved "recent" chips per tab, after the saved ones. */
const MAX_RECENT_CHIPS = 6;

/** Verify endpoints fall back to this when the provider returns no name. */
const GENERIC_VERIFIED = "Verified";

function verifiedName(name: string | null) {
  return name && name !== GENERIC_VERIFIED && !name.startsWith("Showmax")
    ? name
    : null;
}

export default function PayBillsPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("airtime");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [history, setHistory] = useState<BillRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Airtime
  const [airNetwork, setAirNetwork] = useState("mtn");
  const [airPhone, setAirPhone] = useState("");
  const [airAmount, setAirAmount] = useState("");

  // Data
  const [dataNetwork, setDataNetwork] = useState("mtn");
  const [dataPhone, setDataPhone] = useState("");
  const [dataPlans, setDataPlans] = useState<Variation[]>([]);
  const [dataPlanId, setDataPlanId] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);

  // Electricity
  const [disco, setDisco] = useState("ikeja-electric");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [elecAmount, setElecAmount] = useState("");
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [lastToken, setLastToken] = useState<string | null>(null);

  // TV
  const [tvProvider, setTvProvider] = useState("dstv");
  const [smartcard, setSmartcard] = useState("");
  const [tvPlans, setTvPlans] = useState<Variation[]>([]);
  const [tvPlanId, setTvPlanId] = useState("");
  const [tvCustomerName, setTvCustomerName] = useState<string | null>(null);
  const [tvPlansLoading, setTvPlansLoading] = useState(false);

  // Betting
  const [betProvider, setBetProvider] = useState("Bet9ja");
  const [betAccountId, setBetAccountId] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [betCustomerName, setBetCustomerName] = useState<string | null>(null);

  // ePINs
  const [epinNetwork, setEpinNetwork] = useState("mtn");
  const [epinValue, setEpinValue] = useState(100);
  const [epinQuantity, setEpinQuantity] = useState(1);
  const [lastEpins, setLastEpins] = useState<Epin[]>([]);
  const [epinsPending, setEpinsPending] = useState(false);

  // Saved beneficiaries
  const [userId, setUserId] = useState<string | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [recents, setRecents] = useState<RecentRecipient[]>([]);
  // False until we know the bill_beneficiaries table exists.
  const [canSaveBeneficiaries, setCanSaveBeneficiaries] = useState(false);
  const [saveBen, setSaveBen] = useState(true);
  const [benNickname, setBenNickname] = useState("");
  // Plan to pre-select once a picked beneficiary's plan list has loaded.
  const pendingDataPlan = useRef<{ serviceId: string; planId: string } | null>(null);
  const pendingTvPlan = useRef<{ serviceId: string; planId: string } | null>(null);
  // Drops verify responses that a newer verify (e.g. a second chip tap) superseded.
  const verifySeq = useRef(0);

  const epinTotal = useMemo(
    () => epinValue * epinQuantity,
    [epinValue, epinQuantity],
  );

  const selectedDataPlan = useMemo(
    () => dataPlans.find((p) => String(p.variation_id) === dataPlanId),
    [dataPlans, dataPlanId],
  );

  const selectedTvPlan = useMemo(
    () => tvPlans.find((p) => String(p.variation_id) === tvPlanId),
    [tvPlans, tvPlanId],
  );

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      router.push("/login");
      return null;
    }
    return session.access_token;
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const { data, error } = await supabaseClient
        .from("bill_payments")
        .select(
          "id, product_type, service_id, customer_id, amount, status, provider_token, created_at",
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) {
        // Table may not exist yet
        console.warn("bill history:", error.message);
        setHistory([]);
        return;
      }
      setHistory((data as BillRow[]) || []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadBeneficiaries = useCallback(async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);
    const [saved, recent] = await Promise.all([
      listBeneficiaries(session.user.id),
      listRecentRecipients(session.user.id),
    ]);
    setBeneficiaries(saved.items);
    setCanSaveBeneficiaries(saved.available);
    setRecents(recent);
  }, []);

  useEffect(() => {
    loadHistory();
    loadBeneficiaries();
  }, [loadHistory, loadBeneficiaries]);

  // Each tab starts with a fresh save choice.
  const switchTab = (key: TabKey) => {
    setTab(key);
    setSaveBen(true);
    setBenNickname("");
  };

  // Allow deep links from the dashboard promo, e.g. /dashboard/pay-bills?tab=data
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested && TABS.some((t) => t.key === requested)) {
      setTab(requested as TabKey);
    }
  }, []);

  const loadDataPlans = useCallback(async (serviceId: string) => {
    setPlansLoading(true);
    setDataPlanId("");
    try {
      const res = await fetch(
        `/api/bills/variations?type=data&service_id=${encodeURIComponent(serviceId)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load data plans");
      const list = (json.data || []) as Variation[];
      const available = list.filter(
        (p) =>
          !p.availability ||
          p.availability.toLowerCase() === "available",
      );
      setDataPlans(available);
      const wanted = pendingDataPlan.current;
      if (wanted && wanted.serviceId === serviceId) {
        pendingDataPlan.current = null;
        if (available.some((p) => String(p.variation_id) === wanted.planId)) {
          setDataPlanId(wanted.planId);
        }
      }
    } catch (err: any) {
      setDataPlans([]);
      toast.error(err.message || "Could not load data plans");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadTvPlans = useCallback(async (serviceId: string) => {
    setTvPlansLoading(true);
    setTvPlanId("");
    try {
      const res = await fetch(
        `/api/bills/variations?type=tv&service_id=${encodeURIComponent(serviceId)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load TV packages");
      const list = (json.data || []) as Variation[];
      const available = list.filter(
        (p) =>
          !p.availability ||
          p.availability.toLowerCase() === "available",
      );
      setTvPlans(available);
      const wanted = pendingTvPlan.current;
      if (wanted && wanted.serviceId === serviceId) {
        pendingTvPlan.current = null;
        if (available.some((p) => String(p.variation_id) === wanted.planId)) {
          setTvPlanId(wanted.planId);
        }
      }
    } catch (err: any) {
      setTvPlans([]);
      toast.error(err.message || "Could not load TV packages");
    } finally {
      setTvPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "data") loadDataPlans(dataNetwork);
  }, [tab, dataNetwork, loadDataPlans]);

  useEffect(() => {
    if (tab === "tv") loadTvPlans(tvProvider);
  }, [tab, tvProvider, loadTvPlans]);

  const handleChange = async (key: string) => {
    if (key === "sign-out") {
      await supabaseClient.auth.signOut();
      router.push("/login");
    } else {
      router.push(`/dashboard${key !== "home" ? `/${key}` : ""}`);
    }
  };

  /** Save or refresh the paid recipient. Never blocks a successful payment. */
  const rememberRecipient = async (recipient: BeneficiaryInput) => {
    if (!userId || !canSaveBeneficiaries || !recipient.customer_id.trim()) return;
    const existing = beneficiaries.some(
      (b) => beneficiaryKey(b) === beneficiaryKey(recipient),
    );
    if (!existing && !saveBen) return;
    try {
      await saveBeneficiary(userId, {
        ...recipient,
        nickname: existing ? null : benNickname,
      });
      if (!existing) toast.success("Beneficiary saved");
      setBenNickname("");
    } catch (err: any) {
      console.warn("save beneficiary:", err?.message);
      toast.error("Payment went through, but the beneficiary could not be saved.");
    }
  };

  const pay = async (
    payload: Record<string, unknown>,
    recipient?: BeneficiaryInput,
  ) => {
    const token = await getAccessToken();
    if (!token) return;

    setSubmitting(true);
    setLastToken(null);
    setLastEpins([]);
    setEpinsPending(false);
    try {
      const res = await fetch("/api/bills/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Payment failed");
      }

      toast.success("Payment successful");
      notifyFundsChanged(json.new_balance);
      if (json.token) setLastToken(String(json.token));
      if (Array.isArray(json.epins) && json.epins.length) {
        setLastEpins(json.epins as Epin[]);
      }
      if (json.epins_pending) {
        setEpinsPending(true);
        toast("Order is processing — your PINs will appear shortly.", {
          icon: "⏳",
        });
      }
      if (recipient) await rememberRecipient(recipient);
      await Promise.all([loadHistory(), loadBeneficiaries()]);
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAirtime = async (e: React.FormEvent) => {
    e.preventDefault();
    await pay(
      {
        product_type: "airtime",
        service_id: airNetwork,
        phone: airPhone.trim(),
        amount: Number(airAmount),
      },
      { product_type: "airtime", service_id: airNetwork, customer_id: airPhone },
    );
  };

  const handleData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDataPlan) {
      toast.error("Select a data plan");
      return;
    }
    await pay(
      {
        product_type: "data",
        service_id: dataNetwork,
        phone: dataPhone.trim(),
        variation_id: String(selectedDataPlan.variation_id),
        amount: Number(selectedDataPlan.price),
      },
      {
        product_type: "data",
        service_id: dataNetwork,
        customer_id: dataPhone,
        variation_id: String(selectedDataPlan.variation_id),
      },
    );
  };

  /**
   * Shared verify call for meters, smartcards and betting accounts. `silent`
   * skips the success toast when verification runs automatically after a
   * beneficiary is picked.
   */
  const runVerify = async (opts: {
    customerId: string;
    serviceId: string;
    variationId?: string;
    emptyMessage: string;
    successMessage: string;
    setName: (name: string | null) => void;
    silent?: boolean;
  }) => {
    const token = await getAccessToken();
    if (!token) return;
    const customerId = opts.customerId.trim();
    if (!customerId) {
      toast.error(opts.emptyMessage);
      return;
    }
    const seq = ++verifySeq.current;
    setVerifying(true);
    opts.setName(null);
    try {
      const res = await fetch("/api/bills/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          service_id: opts.serviceId,
          ...(opts.variationId ? { variation_id: opts.variationId } : {}),
        }),
      });
      const json = await res.json();
      if (seq !== verifySeq.current) return;
      if (!res.ok) throw new Error(json.message || "Verification failed");
      opts.setName(json?.data?.customer_name || GENERIC_VERIFIED);
      if (!opts.silent) toast.success(opts.successMessage);
    } catch (err: any) {
      if (seq === verifySeq.current) {
        toast.error(err.message || "Verification failed");
      }
    } finally {
      if (seq === verifySeq.current) setVerifying(false);
    }
  };

  const verifyElectricity = (
    override?: { customerId: string; serviceId: string; meterType: string },
    silent = false,
  ) =>
    runVerify({
      customerId: override?.customerId ?? meterNumber,
      serviceId: override?.serviceId ?? disco,
      variationId: override?.meterType ?? meterType,
      emptyMessage: "Enter meter / account number",
      successMessage: "Customer verified",
      setName: setCustomerName,
      silent,
    });

  const handleElectricity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      toast.error("Verify the meter first");
      return;
    }
    await pay(
      {
        product_type: "electricity",
        service_id: disco,
        customer_id: meterNumber.trim(),
        variation_id: meterType,
        amount: Number(elecAmount),
      },
      {
        product_type: "electricity",
        service_id: disco,
        customer_id: meterNumber,
        variation_id: meterType,
        customer_name: verifiedName(customerName),
      },
    );
  };

  const verifyTv = (
    override?: { customerId: string; serviceId: string },
    silent = false,
  ) => {
    const serviceId = override?.serviceId ?? tvProvider;
    const customerId = override?.customerId ?? smartcard;
    if (serviceId === "showmax") {
      if (!customerId.trim()) {
        toast.error("Enter smartcard / IUC number");
        return;
      }
      verifySeq.current++;
      setVerifying(false);
      setTvCustomerName("Showmax (no verify required)");
      return;
    }
    return runVerify({
      customerId,
      serviceId,
      emptyMessage: "Enter smartcard / IUC number",
      successMessage: "Smartcard verified",
      setName: setTvCustomerName,
      silent,
    });
  };

  const handleTv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTvPlan) {
      toast.error("Select a package");
      return;
    }
    if (!tvCustomerName && tvProvider !== "showmax") {
      toast.error("Verify the smartcard first");
      return;
    }
    await pay(
      {
        product_type: "tv",
        service_id: tvProvider,
        customer_id: smartcard.trim(),
        variation_id: String(selectedTvPlan.variation_id),
        amount: Number(selectedTvPlan.price),
      },
      {
        product_type: "tv",
        service_id: tvProvider,
        customer_id: smartcard,
        variation_id: String(selectedTvPlan.variation_id),
        customer_name: verifiedName(tvCustomerName),
      },
    );
  };

  const verifyBetting = (
    override?: { customerId: string; serviceId: string },
    silent = false,
  ) =>
    runVerify({
      customerId: override?.customerId ?? betAccountId,
      serviceId: override?.serviceId ?? betProvider,
      emptyMessage: "Enter your betting account ID",
      successMessage: "Account verified",
      setName: setBetCustomerName,
      silent,
    });

  const handleBetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!betCustomerName) {
      toast.error("Verify the betting account first");
      return;
    }
    const amount = Number(betAmount);
    if (!Number.isFinite(amount) || amount < BETTING_MIN || amount > BETTING_MAX) {
      toast.error(
        `Amount must be between ₦${BETTING_MIN.toLocaleString()} and ₦${BETTING_MAX.toLocaleString()}`,
      );
      return;
    }
    await pay(
      {
        product_type: "betting",
        service_id: betProvider,
        customer_id: betAccountId.trim(),
        amount,
      },
      {
        product_type: "betting",
        service_id: betProvider,
        customer_id: betAccountId,
        customer_name: verifiedName(betCustomerName),
      },
    );
  };

  const handleEpins = async (e: React.FormEvent) => {
    e.preventDefault();
    await pay({
      product_type: "epins",
      service_id: epinNetwork,
      value: epinValue,
      quantity: epinQuantity,
    });
  };

  // ---- Beneficiary picker -------------------------------------------------

  const serviceLabel = useCallback(
    (serviceId: string) =>
      SERVICE_OPTIONS[tab]?.find((o) => o.id === serviceId)?.label || serviceId,
    [tab],
  );

  /** Saved and recent recipients for the open tab, limited to providers it offers. */
  const { tabSaved, tabRecents } = useMemo(() => {
    const offered = new Set((SERVICE_OPTIONS[tab] || []).map((o) => o.id));
    const savedKeys = new Set(beneficiaries.map(beneficiaryKey));
    return {
      tabSaved: beneficiaries.filter(
        (b) => b.product_type === tab && offered.has(b.service_id),
      ),
      tabRecents: recents
        .filter(
          (r) =>
            r.product_type === tab &&
            offered.has(r.service_id) &&
            !savedKeys.has(beneficiaryKey(r)),
        )
        .slice(0, MAX_RECENT_CHIPS),
    };
  }, [tab, beneficiaries, recents]);

  /** The recipient currently typed into the open tab's form. */
  const currentKey = useMemo(() => {
    const current: Record<string, [string, string]> = {
      airtime: [airNetwork, airPhone],
      data: [dataNetwork, dataPhone],
      electricity: [disco, meterNumber],
      tv: [tvProvider, smartcard],
      betting: [betProvider, betAccountId],
    };
    const entry = current[tab];
    if (!entry || !entry[1].trim()) return null;
    return beneficiaryKey({
      product_type: tab,
      service_id: entry[0],
      customer_id: entry[1],
    });
  }, [
    tab,
    airNetwork,
    airPhone,
    dataNetwork,
    dataPhone,
    disco,
    meterNumber,
    tvProvider,
    smartcard,
    betProvider,
    betAccountId,
  ]);

  const currentSaved = useMemo(
    () =>
      currentKey
        ? beneficiaries.find((b) => beneficiaryKey(b) === currentKey) || null
        : null,
    [currentKey, beneficiaries],
  );

  const pickBeneficiary = (item: Beneficiary | RecentRecipient) => {
    const { service_id: serviceId, customer_id: customerId, variation_id: planId } = item;
    switch (item.product_type) {
      case "airtime":
        setAirNetwork(serviceId);
        setAirPhone(customerId);
        break;
      case "data":
        setDataPhone(customerId);
        if (planId) {
          if (serviceId === dataNetwork && !plansLoading) {
            if (dataPlans.some((p) => String(p.variation_id) === planId)) {
              setDataPlanId(planId);
            }
          } else {
            pendingDataPlan.current = { serviceId, planId };
          }
        }
        setDataNetwork(serviceId);
        break;
      case "electricity": {
        const type = planId === "postpaid" ? "postpaid" : "prepaid";
        setDisco(serviceId);
        setMeterType(type);
        setMeterNumber(customerId);
        verifyElectricity({ customerId, serviceId, meterType: type }, true);
        break;
      }
      case "tv":
        setSmartcard(customerId);
        if (planId) {
          if (serviceId === tvProvider && !tvPlansLoading) {
            if (tvPlans.some((p) => String(p.variation_id) === planId)) {
              setTvPlanId(planId);
            }
          } else {
            pendingTvPlan.current = { serviceId, planId };
          }
        }
        setTvProvider(serviceId);
        verifyTv({ customerId, serviceId }, true);
        break;
      case "betting":
        setBetProvider(serviceId);
        setBetAccountId(customerId);
        verifyBetting({ customerId, serviceId }, true);
        break;
    }
  };

  const removeBeneficiary = async (item: Beneficiary) => {
    const label = item.nickname || item.customer_name || item.customer_id;
    if (!window.confirm(`Remove ${label} from your saved beneficiaries?`)) return;
    try {
      await deleteBeneficiary(item.id);
      setBeneficiaries((list) => list.filter((b) => b.id !== item.id));
      toast.success("Beneficiary removed");
    } catch (err: any) {
      toast.error(err.message || "Could not remove beneficiary");
    }
  };

  const saveToggle = canSaveBeneficiaries ? (
    <SaveBeneficiaryToggle
      alreadySaved={currentSaved}
      checked={saveBen}
      onCheckedChange={setSaveBen}
      nickname={benNickname}
      onNicknameChange={setBenNickname}
      disabled={submitting}
    />
  ) : null;

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />

      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-backdrop-filter:bg-[#e4e9ee]/60">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
          <span className="text-base font-semibold text-gray-900">Pay Bills</span>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey="pay-bills" onChange={handleChange} />
        </div>

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
                  <span className="text-base font-semibold text-gray-900">Menu</span>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar
                    activeKey="pay-bills"
                    onChange={(key) => {
                      handleChange(key);
                      setMobileOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Pay Bills
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Buy airtime &amp; data, pay electricity, or renew cable TV from your
              wallet balance.
            </p>
          </div>

          {lastToken && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Electricity token</p>
                <p className="font-mono text-sm text-green-800 break-all mt-1">
                  {lastToken}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-200">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key)}
                  className={[
                    "flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors",
                    tab === key
                      ? "bg-[#F87D1F] text-white"
                      : "text-gray-700 hover:bg-orange-50 hover:text-[#F87D1F]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4 md:p-6 max-w-lg">
              {tab !== "epins" && (
                <BeneficiaryPicker
                  key={tab}
                  saved={tabSaved}
                  recents={tabRecents}
                  selectedKey={currentKey}
                  keyOf={beneficiaryKey}
                  serviceLabel={serviceLabel}
                  onPick={pickBeneficiary}
                  onDelete={removeBeneficiary}
                />
              )}

              {tab === "airtime" && (
                <form onSubmit={handleAirtime} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Network
                    </label>
                    <select
                      className={inputClass}
                      value={airNetwork}
                      onChange={(e) => setAirNetwork(e.target.value)}
                    >
                      {NETWORKS.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone number
                    </label>
                    <input
                      className={inputClass}
                      value={airPhone}
                      onChange={(e) => setAirPhone(e.target.value)}
                      placeholder="08012345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₦)
                    </label>
                    <input
                      type="number"
                      min={50}
                      className={inputClass}
                      value={airAmount}
                      onChange={(e) => setAirAmount(e.target.value)}
                      placeholder="100"
                      required
                    />
                  </div>
                  {saveToggle}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#F87D1F] hover:bg-[#e06b10] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {submitting ? "Processing..." : "Buy Airtime"}
                  </button>
                </form>
              )}

              {tab === "data" && (
                <form onSubmit={handleData} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Network
                    </label>
                    <select
                      className={inputClass}
                      value={dataNetwork}
                      onChange={(e) => setDataNetwork(e.target.value)}
                    >
                      {DATA_NETWORKS.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone number
                    </label>
                    <input
                      className={inputClass}
                      value={dataPhone}
                      onChange={(e) => setDataPhone(e.target.value)}
                      placeholder="08012345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data plan
                    </label>
                    {plansLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading plans...
                      </div>
                    ) : (
                      <select
                        className={inputClass}
                        value={dataPlanId}
                        onChange={(e) => setDataPlanId(e.target.value)}
                        required
                      >
                        <option value="">Select a plan</option>
                        {dataPlans.map((p) => (
                          <option
                            key={String(p.variation_id)}
                            value={String(p.variation_id)}
                          >
                            {p.data_plan} — ₦
                            {Number(p.price).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {saveToggle}
                  <button
                    type="submit"
                    disabled={submitting || plansLoading}
                    className="w-full bg-[#F87D1F] hover:bg-[#e06b10] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {submitting
                      ? "Processing..."
                      : selectedDataPlan
                        ? `Buy Data — ₦${Number(selectedDataPlan.price).toLocaleString()}`
                        : "Buy Data"}
                  </button>
                </form>
              )}

              {tab === "electricity" && (
                <form onSubmit={handleElectricity} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Disco
                    </label>
                    <select
                      className={inputClass}
                      value={disco}
                      onChange={(e) => {
                        setDisco(e.target.value);
                        setCustomerName(null);
                      }}
                    >
                      {DISCOS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meter type
                    </label>
                    <select
                      className={inputClass}
                      value={meterType}
                      onChange={(e) => {
                        setMeterType(e.target.value as "prepaid" | "postpaid");
                        setCustomerName(null);
                      }}
                    >
                      <option value="prepaid">Prepaid</option>
                      <option value="postpaid">Postpaid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meter / account number
                    </label>
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        value={meterNumber}
                        onChange={(e) => {
                          setMeterNumber(e.target.value);
                          setCustomerName(null);
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => verifyElectricity()}
                        disabled={verifying}
                        className="shrink-0 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {verifying ? "..." : "Verify"}
                      </button>
                    </div>
                    {customerName && (
                      <p className="text-sm text-green-700 mt-2">
                        Customer: {customerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₦)
                    </label>
                    <input
                      type="number"
                      min={100}
                      className={inputClass}
                      value={elecAmount}
                      onChange={(e) => setElecAmount(e.target.value)}
                      required
                    />
                  </div>
                  {saveToggle}
                  <button
                    type="submit"
                    disabled={submitting || !customerName}
                    className="w-full bg-[#F87D1F] hover:bg-[#e06b10] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {submitting ? "Processing..." : "Pay Electricity"}
                  </button>
                </form>
              )}

              {tab === "tv" && (
                <form onSubmit={handleTv} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <select
                      className={inputClass}
                      value={tvProvider}
                      onChange={(e) => {
                        setTvProvider(e.target.value);
                        setTvCustomerName(null);
                      }}
                    >
                      {TV_PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Smartcard / IUC
                    </label>
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        value={smartcard}
                        onChange={(e) => {
                          setSmartcard(e.target.value);
                          setTvCustomerName(null);
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => verifyTv()}
                        disabled={verifying}
                        className="shrink-0 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {verifying ? "..." : "Verify"}
                      </button>
                    </div>
                    {tvCustomerName && (
                      <p className="text-sm text-green-700 mt-2">
                        Customer: {tvCustomerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package
                    </label>
                    {tvPlansLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading packages...
                      </div>
                    ) : (
                      <select
                        className={inputClass}
                        value={tvPlanId}
                        onChange={(e) => setTvPlanId(e.target.value)}
                        required
                      >
                        <option value="">Select a package</option>
                        {tvPlans.map((p) => (
                          <option
                            key={String(p.variation_id)}
                            value={String(p.variation_id)}
                          >
                            {p.package_bouquet} — ₦
                            {Number(p.price).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {saveToggle}
                  <button
                    type="submit"
                    disabled={submitting || tvPlansLoading}
                    className="w-full bg-[#F87D1F] hover:bg-[#e06b10] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {submitting
                      ? "Processing..."
                      : selectedTvPlan
                        ? `Subscribe — ₦${Number(selectedTvPlan.price).toLocaleString()}`
                        : "Subscribe"}
                  </button>
                </form>
              )}

              {tab === "betting" && (
                <form onSubmit={handleBetting} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bookmaker
                    </label>
                    <select
                      className={inputClass}
                      value={betProvider}
                      onChange={(e) => {
                        setBetProvider(e.target.value);
                        setBetCustomerName(null);
                      }}
                    >
                      {BETTING_PROVIDERS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {BETTING_USES_PHONE.has(betProvider)
                        ? "Registered phone number"
                        : "Betting account ID"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        value={betAccountId}
                        onChange={(e) => {
                          setBetAccountId(e.target.value);
                          setBetCustomerName(null);
                        }}
                        placeholder={
                          BETTING_USES_PHONE.has(betProvider)
                            ? "08012345678"
                            : "Your account / user ID"
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() => verifyBetting()}
                        disabled={verifying}
                        className="shrink-0 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {verifying ? "..." : "Verify"}
                      </button>
                    </div>
                    {betCustomerName && (
                      <p className="text-sm text-green-700 mt-2">
                        Account: {betCustomerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₦)
                    </label>
                    <input
                      type="number"
                      min={BETTING_MIN}
                      max={BETTING_MAX}
                      className={inputClass}
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min ₦{BETTING_MIN.toLocaleString()} — max ₦
                      {BETTING_MAX.toLocaleString()}
                    </p>
                  </div>
                  {saveToggle}
                  <button
                    type="submit"
                    disabled={submitting || !betCustomerName}
                    className="w-full bg-[#F87D1F] hover:bg-[#e06b10] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {submitting ? "Processing..." : "Fund Betting Account"}
                  </button>
                </form>
              )}

              {tab === "epins" && (
                <form onSubmit={handleEpins} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Network
                    </label>
                    <select
                      className={inputClass}
                      value={epinNetwork}
                      onChange={(e) => setEpinNetwork(e.target.value)}
                    >
                      {EPIN_NETWORKS.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Denomination
                    </label>
                    <select
                      className={inputClass}
                      value={epinValue}
                      onChange={(e) => setEpinValue(Number(e.target.value))}
                    >
                      {EPIN_VALUES.map((v) => (
                        <option key={v} value={v}>
                          ₦{v.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={EPIN_MAX_QTY}
                      step={1}
                      className={inputClass}
                      value={epinQuantity}
                      onChange={(e) =>
                        setEpinQuantity(
                          Math.max(
                            1,
                            Math.min(EPIN_MAX_QTY, Number(e.target.value) || 1),
                          ),
                        )
                      }
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1 — {EPIN_MAX_QTY} pins per order
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold text-gray-900">
                        ₦{epinTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#F87D1F] hover:bg-[#e06b10] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {submitting
                      ? "Processing..."
                      : `Buy ePINs — ₦${epinTotal.toLocaleString()}`}
                  </button>

                  {epinsPending && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      Your order is still processing. The PINs will appear in
                      your bill history once the provider releases them.
                    </p>
                  )}

                  {lastEpins.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Your PINs
                      </h3>
                      {lastEpins.map((p, i) => (
                        <div
                          key={`${p.serial || p.pin || i}`}
                          className="rounded-lg border border-gray-200 bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm text-gray-900 break-all">
                              {p.pin}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(String(p.pin), "PIN")}
                              className="shrink-0 inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </button>
                          </div>
                          {p.serial && (
                            <p className="text-xs text-gray-500 mt-1">
                              Serial: {p.serial}
                            </p>
                          )}
                          {p.instruction && (
                            <p className="text-xs text-gray-600 mt-1">
                              {p.instruction}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">
                Recent bill payments
              </h2>
              <button
                type="button"
                onClick={loadHistory}
                className="text-sm text-[#194572] hover:underline"
              >
                Refresh
              </button>
            </div>
            {historyLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500">No bill payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Service</th>
                      <th className="py-2 pr-3 font-medium">Amount</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-2.5 pr-3 capitalize">
                          {row.product_type}
                        </td>
                        <td className="py-2.5 pr-3">{row.service_id}</td>
                        <td className="py-2.5 pr-3">
                          ₦{Number(row.amount).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-3 capitalize">{row.status}</td>
                        <td className="py-2.5 text-gray-600">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
