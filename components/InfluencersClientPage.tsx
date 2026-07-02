"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createInfluencerProfile,
  deleteInfluencerProfile,
  updateInfluencerOrder,
  updateInfluencerProfile
} from "@/app/(admin)/influencers/actions";

export type InfluencerProfile = {
  id: string;
  name: string;
  category: string;
  full_bio: string;
  date_joined: string;
  profile_image_url: string;
  email_address: string;
  instagram_username: string;
  instagram_url: string;
  tiktok_username: string;
  tiktok_url: string;
  facebook_name: string;
  facebook_url: string;
  youtube_channel_name: string;
  youtube_url: string;
  featured_tiktok_video_url_1: string;
  featured_tiktok_video_url_2: string;
  featured_tiktok_video_url_3: string;
  sort_order: number;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
};

type InfluencersClientPageProps = {
  influencers: InfluencerProfile[];
  returnPath: "/influencers" | "/cms/influencers";
  dataLoadFailed: boolean;
  schemaUpdateRequired: boolean;
  setupMissing: boolean;
};

const nicheOptions = ["Lifestyle", "Fashion", "Beauty", "Sports", "Food", "Entertainment", "Travel"];
const maxProfilePhotoSize = 50 * 1024 * 1024;

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" }
];

const emptyInfluencer: InfluencerProfile = {
  id: "",
  name: "",
  category: "",
  full_bio: "",
  date_joined: "",
  profile_image_url: "",
  email_address: "",
  instagram_username: "",
  instagram_url: "",
  tiktok_username: "",
  tiktok_url: "",
  facebook_name: "",
  facebook_url: "",
  youtube_channel_name: "",
  youtube_url: "",
  featured_tiktok_video_url_1: "",
  featured_tiktok_video_url_2: "",
  featured_tiktok_video_url_3: "",
  sort_order: 0,
  status: "draft",
  is_featured: false
};

function splitNiches(value: string) {
  return value.split("/").map((item) => item.trim()).filter(Boolean).slice(0, 2);
}

function FieldInput({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
  required = false
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-800">
      {label}
      <input
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-adminBlue focus:ring-4 focus:ring-blue-50"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function NichePicker({ value }: { value: string }) {
  const [selected, setSelected] = useState(splitNiches(value));

  return (
    <fieldset className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <legend className="text-sm font-black text-slate-800">Niche</legend>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase text-slate-500">Max 2 selections</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {nicheOptions.map((niche) => {
          const isChecked = selected.includes(niche);
          const isDisabled = !isChecked && selected.length >= 2;

          return (
            <label
              key={niche}
              className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-black transition ${
                isChecked ? "border-adminBlue bg-blue-50 text-adminBlue" : "border-slate-200 bg-white text-slate-700"
              } ${isDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:border-adminBlue/50"}`}
            >
              <input
                checked={isChecked}
                disabled={isDisabled}
                name="niche"
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelected((current) => [...current, niche].slice(0, 2));
                  } else {
                    setSelected((current) => current.filter((item) => item !== niche));
                  }
                }}
                type="checkbox"
                value={niche}
              />
              {niche}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function InfluencerForm({
  influencer = emptyInfluencer,
  mode,
  returnPath,
  dataLoadFailed,
  setupMissing,
  schemaUpdateRequired
}: {
  influencer?: InfluencerProfile;
  mode: "create" | "update";
  returnPath: InfluencersClientPageProps["returnPath"];
  dataLoadFailed: boolean;
  schemaUpdateRequired: boolean;
  setupMissing: boolean;
}) {
  const action = mode === "create" ? createInfluencerProfile : updateInfluencerProfile;
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(influencer.profile_image_url);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(influencer.profile_image_url);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");
  const [photoMessage, setPhotoMessage] = useState("");

  async function uploadPhoto(file: File) {
    if (file.size > maxProfilePhotoSize) {
      setPhotoStatus("error");
      setPhotoMessage("Photo must be 50 MB or smaller.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoStatus("error");
      setPhotoMessage("Photo must be an image file.");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoStatus("uploading");
    setPhotoMessage("Uploading photo...");
    setPreviewPhotoUrl(localPreviewUrl);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("name", influencer.name || "profile");

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 60000);
      const response = await fetch("/api/influencer-profile-photo", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      window.clearTimeout(timeout);
      const result = await response.json() as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        setPhotoStatus("error");
        setPhotoMessage(
          result.error === "file-too-large"
            ? "Photo must be 50 MB or smaller."
            : result.error === "invalid-file"
              ? "Photo must be an image file."
              : "Photo upload failed. Check the media-assets bucket setup."
        );
        return;
      }

      setPreviewPhotoUrl(result.url);
      setUploadedPhotoUrl(result.url);
      setPhotoStatus("uploaded");
      setPhotoMessage("Photo uploaded.");
    } catch {
      setPhotoStatus("error");
      setPreviewPhotoUrl(uploadedPhotoUrl);
      setPhotoMessage("Photo upload timed out. Try a smaller image or check storage setup.");
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
    }
  }

  return (
    <form action={action} className="grid gap-5">
      <input name="return_path" type="hidden" value={returnPath} />
      {mode === "update" ? <input name="id" type="hidden" value={influencer.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <label className="group relative h-56 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
          {previewPhotoUrl ? (
            <img alt={influencer.name} className="h-full w-full object-cover" src={previewPhotoUrl} />
          ) : (
            <div className="grid h-full place-items-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">Photo</div>
          )}
          <input
            accept="image/*"
            className="sr-only"
            disabled={photoStatus === "uploading"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadPhoto(file);
              }
            }}
            type="file"
          />
          {photoStatus === "uploading" ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/45 backdrop-blur-[1px]">
              <div className="grid justify-items-center gap-2 text-xs font-black uppercase text-white">
                <span className="h-9 w-9 animate-spin rounded-full border-4 border-white/40 border-t-white" />
                Uploading
              </div>
            </div>
          ) : null}
          <span className="absolute inset-x-4 bottom-4 rounded-lg bg-adminBlue px-4 py-3 text-center text-sm font-black text-white shadow-lg transition group-hover:bg-adminBlue/90">
            {previewPhotoUrl ? "Change Photo" : "Upload Photo"}
          </span>
        </label>
        <div className="grid content-start gap-4">
          <div className="grid gap-4 md:grid-cols-[1fr_190px]">
            <FieldInput defaultValue={influencer.name} label="Name" name="name" required />
            <FieldInput defaultValue={influencer.date_joined} label="Date Joined" name="date_joined" type="date" />
          </div>
          <label className="grid gap-2 text-sm font-black text-slate-800">
            About
            <textarea
              className="min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-adminBlue focus:ring-4 focus:ring-blue-50"
              defaultValue={influencer.full_bio}
              name="full_bio"
            />
          </label>
          <div className="grid gap-2">
            <input name="profile_image_url" readOnly type="hidden" value={uploadedPhotoUrl} />
            {photoMessage ? (
              <span className={`text-xs font-black ${photoStatus === "error" ? "text-red-600" : "text-slate-500"}`}>
                {photoMessage}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <NichePicker value={influencer.category} />

      <FieldInput defaultValue={influencer.email_address} label="Email Address" name="email_address" type="email" />

      <div className="grid gap-4 md:grid-cols-2">
        <FieldInput defaultValue={influencer.instagram_username} label="Instagram Username" name="instagram_username" placeholder="@username" />
        <FieldInput defaultValue={influencer.instagram_url} label="Instagram Link" name="instagram_url" type="url" />
        <FieldInput defaultValue={influencer.tiktok_username} label="TikTok Username" name="tiktok_username" placeholder="@username" />
        <FieldInput defaultValue={influencer.tiktok_url} label="TikTok Link" name="tiktok_url" type="url" />
        <FieldInput defaultValue={influencer.facebook_name} label="Facebook Name" name="facebook_name" />
        <FieldInput defaultValue={influencer.facebook_url} label="Facebook Link" name="facebook_url" type="url" />
        <FieldInput defaultValue={influencer.youtube_channel_name} label="YouTube Channel Name" name="youtube_channel_name" />
        <FieldInput defaultValue={influencer.youtube_url} label="YouTube Link" name="youtube_url" type="url" />
      </div>

      <div className="grid gap-4">
        <FieldInput defaultValue={influencer.featured_tiktok_video_url_1} label="Featured TikTok Video 1" name="featured_tiktok_video_url_1" type="url" />
        <FieldInput defaultValue={influencer.featured_tiktok_video_url_2} label="Featured TikTok Video 2" name="featured_tiktok_video_url_2" type="url" />
        <FieldInput defaultValue={influencer.featured_tiktok_video_url_3} label="Featured TikTok Video 3" name="featured_tiktok_video_url_3" type="url" />
      </div>

      <div className="grid gap-4 pb-6 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-black text-slate-800">
          Status
          <select
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-adminBlue focus:ring-4 focus:ring-blue-50"
            defaultValue={influencer.status}
            name="status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-800">
          <input defaultChecked={influencer.is_featured} name="is_featured" type="checkbox" />
          Featured
        </label>
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
        {mode === "update" ? (
          <button
            formAction={deleteInfluencerProfile}
            className="min-h-11 rounded-lg border border-red-200 px-5 text-sm font-black text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={setupMissing || dataLoadFailed}
            type="submit"
          >
            Delete influencer
          </button>
        ) : <span />}
        <button
          className="min-h-11 rounded-lg bg-adminBlue px-6 text-sm font-black text-white transition hover:bg-adminBlue/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={setupMissing || dataLoadFailed || schemaUpdateRequired || photoStatus === "uploading"}
          type="submit"
        >
          {mode === "create" ? "Save influencer" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function InfluencersClientPage({
  influencers,
  returnPath,
  dataLoadFailed,
  schemaUpdateRequired,
  setupMissing
}: InfluencersClientPageProps) {
  const [rows, setRows] = useState(influencers);
  const [activeInfluencer, setActiveInfluencer] = useState<InfluencerProfile | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeIds = useMemo(() => rows.map((row) => row.id), [rows]);

  function commitOrder(nextRows: InfluencerProfile[]) {
    setRows(nextRows);
    const formData = new FormData();
    formData.set("ids", JSON.stringify(nextRows.map((row) => row.id)));
    startTransition(() => {
      void updateInfluencerOrder(formData);
    });
  }

  function moveDraggedRow(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      return;
    }

    const fromIndex = rows.findIndex((row) => row.id === draggedId);
    const toIndex = rows.findIndex((row) => row.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const nextRows = [...rows];
    const [moved] = nextRows.splice(fromIndex, 1);
    nextRows.splice(toIndex, 0, moved);
    commitOrder(nextRows);
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black text-slate-950">Influencer Records</h2>
          <button
            className="min-h-11 rounded-lg bg-adminBlue px-5 text-sm font-black text-white transition hover:bg-adminBlue/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={setupMissing || dataLoadFailed || schemaUpdateRequired}
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            Add Influencer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                <th className="border-b border-slate-200 px-5 py-3">Name</th>
                <th className="border-b border-slate-200 px-5 py-3">Niche</th>
                <th className="border-b border-slate-200 px-5 py-3">Date Joined</th>
                <th className="border-b border-slate-200 px-5 py-3">Status</th>
                <th className="border-b border-slate-200 px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((influencer) => (
                <tr
                  key={influencer.id}
                  className="group bg-white transition hover:bg-blue-50/40"
                  draggable
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggedId(influencer.id);
                  }}
                  onDrop={() => moveDraggedRow(influencer.id)}
                >
                  <td className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition group-hover:border-adminBlue group-hover:text-adminBlue">
                        ::
                      </span>
                      <span className="font-black text-slate-950">{influencer.name}</span>
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 font-bold text-slate-600">{influencer.category || "-"}</td>
                  <td className="border-b border-slate-100 px-5 py-4 font-bold text-slate-600">{influencer.date_joined || "-"}</td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-600">
                      {influencer.status}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-right">
                    <button
                      className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-adminBlue transition hover:border-adminBlue hover:bg-blue-50"
                      onClick={() => setActiveInfluencer(influencer)}
                      type="button"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm font-bold text-slate-500" colSpan={5}>
                    No influencer profiles yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {activeIds.length > 1 ? (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black text-slate-500">
            {isPending ? "Saving order..." : "Drag rows to reorder."}
          </div>
        ) : null}
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Add influencer">
            <header className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-2xl font-black text-slate-950">Add Influencer</h2>
              <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700" onClick={() => setIsCreateOpen(false)} type="button">
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <InfluencerForm
                mode="create"
                returnPath={returnPath}
                dataLoadFailed={dataLoadFailed}
                schemaUpdateRequired={schemaUpdateRequired}
                setupMissing={setupMissing}
              />
            </div>
          </section>
        </div>
      ) : null}

      {activeInfluencer ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={`Edit ${activeInfluencer.name}`}>
            <header className="shrink-0 grid gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {activeInfluencer.profile_image_url ? (
                  <img alt={activeInfluencer.name} className="h-full w-full object-cover" src={activeInfluencer.profile_image_url} />
                ) : (
                  <div className="grid h-full place-items-center text-xs font-black uppercase text-slate-400">Photo</div>
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase text-adminBlue">Influencer Details</p>
                <h2 className="text-2xl font-black text-slate-950">{activeInfluencer.name}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-600">{activeInfluencer.category || "No niche"}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-600">{activeInfluencer.date_joined || "No date joined"}</span>
                  <span className="rounded-full bg-white px-3 py-1 capitalize text-slate-600">{activeInfluencer.status}</span>
                </div>
              </div>
              <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700" onClick={() => setActiveInfluencer(null)} type="button">
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <InfluencerForm
                influencer={activeInfluencer}
                mode="update"
                returnPath={returnPath}
                dataLoadFailed={dataLoadFailed}
                schemaUpdateRequired={schemaUpdateRequired}
                setupMissing={setupMissing}
              />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
