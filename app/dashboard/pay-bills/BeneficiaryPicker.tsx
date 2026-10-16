"use client";

import { useState } from "react";
import { BookmarkCheck, History, Loader2, Trash2, UserRound } from "lucide-react";
import type { Beneficiary, RecentRecipient } from "@/lib/billBeneficiaries";

type Recipient = Beneficiary | RecentRecipient;

function isSaved(item: Recipient): item is Beneficiary {
  return "id" in item;
}

type PickerProps = {
  saved: Beneficiary[];
  recents: RecentRecipient[];
  /** Key of the recipient currently in the form, to highlight its chip. */
  selectedKey: string | null;
  keyOf: (item: Recipient) => string;
  serviceLabel: (serviceId: string) => string;
  onPick: (item: Recipient) => void;
  onDelete: (item: Beneficiary) => Promise<void>;
};

/**
 * Horizontally scrolling chips of saved and recently paid recipients, shown
 * above a bill form. Tapping one fills the form.
 */
export function BeneficiaryPicker({
  saved,
  recents,
  selectedKey,
  keyOf,
  serviceLabel,
  onPick,
  onDelete,
}: PickerProps) {
  const [managing, setManaging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (saved.length === 0 && recents.length === 0) return null;

  const items: Recipient[] = [...saved, ...recents];

  const handleDelete = async (item: Beneficiary) => {
    setDeletingId(item.id);
    try {
      await onDelete(item);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">
          {saved.length === 0
            ? "Recently paid"
            : recents.length === 0
              ? "Saved beneficiaries"
              : "Saved & recent"}
        </p>
        {saved.length > 0 && (
          <button
            type="button"
            onClick={() => setManaging((m) => !m)}
            className="text-sm font-medium text-[#194572] hover:underline"
          >
            {managing ? "Done" : "Manage"}
          </button>
        )}
      </div>

      <div className="-mx-1 px-1 pb-1 flex gap-2 overflow-x-auto snap-x">
        {items.map((item) => {
          const key = keyOf(item);
          const savedItem = isSaved(item);
          const title =
            (savedItem && (item.nickname || item.customer_name)) || item.customer_id;
          const showNumber = title !== item.customer_id;
          const selected = key === selectedKey;
          const deleting = savedItem && deletingId === item.id;

          return (
            <div key={key} className="relative shrink-0 snap-start">
              <button
                type="button"
                disabled={managing || deleting}
                onClick={() => onPick(item)}
                className={[
                  "w-40 text-left rounded-xl px-3 py-2.5 transition-colors",
                  savedItem ? "border bg-white" : "border border-dashed bg-gray-50",
                  selected
                    ? "border-[#F87D1F] ring-2 ring-[#F87D1F]/30 bg-orange-50"
                    : "border-gray-300 hover:border-[#F87D1F] hover:bg-orange-50",
                  managing && savedItem ? "opacity-90" : "",
                  managing && !savedItem ? "opacity-40" : "",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  {savedItem ? (
                    <BookmarkCheck className="h-3.5 w-3.5 text-[#F87D1F]" />
                  ) : (
                    <History className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">{serviceLabel(item.service_id)}</span>
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-gray-900">
                  {title}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {showNumber ? item.customer_id : savedItem ? "Saved" : "Recent"}
                </span>
              </button>

              {managing && savedItem && (
                <button
                  type="button"
                  aria-label={`Remove ${title}`}
                  onClick={() => handleDelete(item)}
                  disabled={deleting}
                  className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow ring-2 ring-white disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ToggleProps = {
  /** The recipient in the form is already saved; payment just refreshes it. */
  alreadySaved: Beneficiary | null;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  disabled?: boolean;
};

/** "Save as beneficiary" option shown just above a bill form's pay button. */
export function SaveBeneficiaryToggle({
  alreadySaved,
  checked,
  onCheckedChange,
  nickname,
  onNicknameChange,
  disabled,
}: ToggleProps) {
  if (alreadySaved) {
    return (
      <p className="flex items-center gap-2 text-sm text-green-700">
        <BookmarkCheck className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Saved as{" "}
          <span className="font-medium">
            {alreadySaved.nickname || alreadySaved.customer_name || alreadySaved.customer_id}
          </span>
        </span>
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
      <label className="flex items-center gap-2.5 text-sm font-medium text-gray-800 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-[#F87D1F]"
        />
        <UserRound className="h-4 w-4 text-gray-500" />
        Save as beneficiary
      </label>
      {checked && (
        <input
          className="mt-2.5 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F87D1F] bg-white text-gray-900"
          value={nickname}
          maxLength={60}
          disabled={disabled}
          onChange={(e) => onNicknameChange(e.target.value)}
          placeholder="Nickname (optional), e.g. Mum's line"
        />
      )}
    </div>
  );
}
