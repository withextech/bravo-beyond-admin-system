"use client";

import { useMemo, useState, type FormEvent } from "react";
import { archivePageSection, savePageSection } from "@/app/(admin)/cms/pages/actions";

export type ContentStatus = "draft" | "published" | "archived";

export type MediaAsset = {
  id: string;
  file_name: string;
  file_type: string;
  public_url: string | null;
  alt_text: string | null;
  caption: string | null;
};

export type PageSectionRecord = {
  id?: string;
  page_key: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  cta_label: string | null;
  cta_url: string | null;
  media_asset_id: string | null;
  sort_order: number;
  status: ContentStatus;
};

export type ClientLogo = {
  id: string;
  brand_name: string;
  logo_media_id: string | null;
  sort_order: number;
  status: ContentStatus;
};

type SectionBlueprint = {
  section_key: string;
  label: string;
  hint: string;
  sort_order: number;
};

type PageBlueprint = {
  key: string;
  label: string;
  route: string;
  purpose: string;
  sections: SectionBlueprint[];
};

type WebsitePageEditorProps = {
  pages: PageBlueprint[];
  sections: PageSectionRecord[];
  mediaAssets: MediaAsset[];
  clientLogos: ClientLogo[];
  initialPageKey: string;
  setupMissing: boolean;
};

type PartnerLogoRow = {
  brandName: string;
  sortOrder: number;
  logo: ClientLogo;
};

const emptyRecord: Omit<PageSectionRecord, "page_key" | "section_key" | "sort_order"> = {
  title: "",
  subtitle: "",
  body: "",
  cta_label: "",
  cta_url: "",
  media_asset_id: "",
  status: "draft"
};

function getRecordKey(pageKey: string, sectionKey: string) {
  return `${pageKey}:${sectionKey}`;
}

function isVideo(asset?: MediaAsset) {
  return Boolean(asset?.file_type?.startsWith("video/"));
}

function MediaPreview({ asset, videoOnly = false }: { asset?: MediaAsset; videoOnly?: boolean }) {
  if (!asset?.public_url) {
    return (
      <div className="cms-media-empty">
        <span>{videoOnly ? "No video selected" : "No media"}</span>
      </div>
    );
  }

  if (isVideo(asset)) {
    return (
      <video className="cms-media-preview" controls muted playsInline preload="metadata">
        <source src={asset.public_url} type={asset.file_type} />
      </video>
    );
  }

  if (videoOnly) {
    return (
      <div className="cms-media-empty">
        <span>No video selected</span>
      </div>
    );
  }

  return <img alt={asset.alt_text || asset.file_name} className="cms-media-preview" src={asset.public_url} />;
}

function PartnerLogoTile({
  asset,
  brandName,
  disabled,
  isUploading,
  onFile
}: {
  asset?: MediaAsset;
  brandName: string;
  disabled: boolean;
  isUploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="partner-logo-preview">
      {asset?.public_url ? (
        <img alt={asset.alt_text || `${brandName} logo`} src={asset.public_url} />
      ) : (
        <span>Add logo</span>
      )}
      <input
        accept="image/*"
        disabled={disabled}
        name="logo_file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) {
            onFile(file);
          }
        }}
        type="file"
      />
      {isUploading ? <span className="partner-logo-spinner" aria-label="Uploading" /> : null}
    </label>
  );
}

export function WebsitePageEditor({
  pages,
  sections,
  mediaAssets,
  clientLogos,
  initialPageKey,
  setupMissing
}: WebsitePageEditorProps) {
  const [activePageKey, setActivePageKey] = useState(initialPageKey);
  const [activeSectionKey, setActiveSectionKey] = useState(pages.find((page) => page.key === initialPageKey)?.sections[0]?.section_key || "");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [partnerLogos, setPartnerLogos] = useState(clientLogos);
  const [partnerAssets, setPartnerAssets] = useState(mediaAssets);
  const [uploadingLogoKey, setUploadingLogoKey] = useState<string | null>(null);
  const [deletingLogoId, setDeletingLogoId] = useState<string | null>(null);
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [newPartnerLogoPreview, setNewPartnerLogoPreview] = useState<string | null>(null);

  const recordsByKey = useMemo(() => {
    return new Map(sections.map((section) => [getRecordKey(section.page_key, section.section_key), section]));
  }, [sections]);

  const mediaById = useMemo(() => {
    return new Map(partnerAssets.map((asset) => [asset.id, asset]));
  }, [partnerAssets]);
  const partnerLogoRows = useMemo(() => {
    return partnerLogos.map((logo, index) => ({
      brandName: logo.brand_name,
      sortOrder: logo.sort_order || index + 1,
      logo
    }));
  }, [partnerLogos]);

  const activePage = pages.find((page) => page.key === activePageKey) || pages[0];
  const activeSection = activePage.sections.find((section) => section.section_key === activeSectionKey) || activePage.sections[0];
  const activeRecord = {
    ...emptyRecord,
    page_key: activePage.key,
    section_key: activeSection.section_key,
    sort_order: activeSection.sort_order,
    ...recordsByKey.get(getRecordKey(activePage.key, activeSection.section_key))
  };
  const selectedAsset = activeRecord.media_asset_id ? mediaById.get(activeRecord.media_asset_id) : undefined;
  const isHeroVideoSection = activePage.key === "home" && activeSection.section_key === "hero";
  const isWhatWeBuildSection = activePage.key === "home" && activeSection.section_key === "intro";
  const isPartnerBrandsSection = activePage.key === "home" && activeSection.section_key === "trusted";

  async function uploadLogo({
    brandName,
    file,
    logoId,
    sortOrder,
    loadingKey
  }: {
    brandName: string;
    file: File;
    logoId?: string;
    sortOrder: number;
    loadingKey: string;
  }) {
    setUploadingLogoKey(loadingKey);

    const formData = new FormData();
    formData.set("brand_name", brandName);
    formData.set("logo_id", logoId || "");
    formData.set("sort_order", String(sortOrder));
    formData.set("logo_file", file);

    try {
      const response = await fetch("/api/partner-logos", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "upload-failed");
      }

      setPartnerAssets((current) => {
        const withoutDuplicate = current.filter((asset) => asset.id !== result.asset.id);
        return [result.asset, ...withoutDuplicate];
      });
      setPartnerLogos((current) => {
        const withoutDuplicate = current.filter((logo) => logo.id !== result.logo.id);
        return [...withoutDuplicate, result.logo].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      });
      return true;
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Logo upload failed.");
      return false;
    } finally {
      setUploadingLogoKey(null);
    }
  }

  async function deleteLogo(logo: ClientLogo) {
    if (!window.confirm(`Delete ${logo.brand_name}?`)) {
      return;
    }

    setDeletingLogoId(logo.id);

    try {
      const response = await fetch("/api/partner-logos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: logo.id })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "delete-failed");
      }

      setPartnerLogos((current) => current.filter((item) => item.id !== logo.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingLogoId(null);
    }
  }

  async function addPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const brandName = String(formData.get("brand_name") || "").trim();
    const file = formData.get("logo_file");

    if (!brandName || !(file instanceof File) || file.size === 0) {
      window.alert("Add the brand name and logo.");
      return;
    }

    setIsAddingPartner(true);
    const ok = await uploadLogo({
      brandName,
      file,
      sortOrder: partnerLogoRows.length + 1,
      loadingKey: "__new__"
    });
    setIsAddingPartner(false);

    if (ok) {
      setNewPartnerLogoPreview(null);
      setIsAddPartnerOpen(false);
    }
  }
  return (
    <div className="website-editor">
      <nav className="website-page-rail" aria-label="Portfolio website pages">
        {pages.map((page) => {
          const isActive = page.key === activePage.key;

          return (
            <button
              aria-pressed={isActive}
              className={isActive ? "is-active" : ""}
              key={page.key}
              onClick={() => {
                setActivePageKey(page.key);
                setActiveSectionKey(page.sections[0]?.section_key || "");
              }}
              type="button"
            >
              <span>{page.label}</span>
            </button>
          );
        })}
      </nav>

      <section className="website-editor-main">
        <header className="website-editor-header">
          <div>
            <h2>{activePage.label}</h2>
          </div>
        </header>

        <div className="website-editor-content">
          <div className="website-section-list">
            <div className="website-section-list-head">
              <strong>Sections</strong>
            </div>
            {activePage.sections.map((section) => {
              const isActive = section.section_key === activeSection.section_key;

              return (
                <button
                  className={isActive ? "is-active" : ""}
                  key={section.section_key}
                  onClick={() => setActiveSectionKey(section.section_key)}
                  type="button"
                >
                  <span>{section.label}</span>
                  <small>{section.hint}</small>
                </button>
              );
            })}
          </div>

          <div className="website-editor-form-panel">
            <div className="website-section-context">
              <div>
                <p>Editing section</p>
                <h3>{activeSection.label}</h3>
              </div>
            </div>

            {isPartnerBrandsSection ? (
              <>
              <div className="partner-logo-toolbar">
                <button type="button" onClick={() => setIsAddPartnerOpen(true)}>Add brand</button>
              </div>
              <div className="partner-logo-list">
                {partnerLogoRows.length === 0 ? (
                  <div className="partner-logo-empty">No partner brands yet. Use Add brand to create the first one.</div>
                ) : null}
                {partnerLogoRows.map(({ brandName, logo, sortOrder }) => {
                  const logoAsset = logo?.logo_media_id ? mediaById.get(logo.logo_media_id) : undefined;

                  return (
                    <div className="partner-logo-row" key={brandName}>
                      <strong>{brandName}</strong>
                      <PartnerLogoTile
                        asset={logoAsset}
                        brandName={brandName}
                        disabled={setupMissing || uploadingLogoKey === logo.id}
                        isUploading={uploadingLogoKey === logo.id}
                        onFile={(file) => {
                          void uploadLogo({
                            brandName,
                            file,
                            logoId: logo.id,
                            sortOrder,
                            loadingKey: logo.id
                          });
                        }}
                      />
                      <button
                        disabled={setupMissing || deletingLogoId === logo.id}
                        onClick={() => {
                          void deleteLogo(logo);
                        }}
                        type="button"
                      >
                        {deletingLogoId === logo.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  );
                })}
              </div>
              {isAddPartnerOpen ? (
                <div className="partner-modal-backdrop">
                  <form className="partner-modal" onSubmit={addPartner}>
                    <div className="partner-modal-header">
                      <div>
                        <p>Add brand</p>
                        <h4>Brand or agency logo</h4>
                      </div>
                      <button type="button" onClick={() => setIsAddPartnerOpen(false)}>Close</button>
                    </div>
                    <label>
                      Brand / Agency Name
                      <input name="brand_name" placeholder="Brand or agency name" required />
                    </label>
                    <input name="sort_order" type="hidden" value={partnerLogoRows.length + 1} />
                    <div className="partner-modal-logo-field">
                      <span>Logo</span>
                      <label className="partner-logo-preview partner-logo-preview-large">
                        {newPartnerLogoPreview ? (
                          <img alt="New partner logo preview" src={newPartnerLogoPreview} />
                        ) : (
                          <span>Upload logo</span>
                        )}
                        <input
                          accept="image/*"
                          name="logo_file"
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            if (newPartnerLogoPreview) {
                              URL.revokeObjectURL(newPartnerLogoPreview);
                            }
                            setNewPartnerLogoPreview(file ? URL.createObjectURL(file) : null);
                          }}
                          required
                          type="file"
                        />
                        {isAddingPartner ? <span className="partner-logo-spinner" aria-label="Uploading" /> : null}
                      </label>
                    </div>
                    <button disabled={setupMissing || isAddingPartner} type="submit">
                      {isAddingPartner ? "Adding..." : "Add brand"}
                    </button>
                  </form>
                </div>
              ) : null}
              </>
            ) : (
            <form action={savePageSection} className="website-section-form">
              <input name="page_key" type="hidden" value={activePage.key} />
              <input name="section_key" type="hidden" value={activeSection.section_key} />
              <input name="sort_order" type="hidden" value={activeSection.sort_order} />

              {isHeroVideoSection ? (
                <>
                  <input name="status" type="hidden" value="published" />
                  <input name="media_asset_id" type="hidden" value={activeRecord.media_asset_id || ""} />
                  <div className="website-hero-video-editor">
                    <div className="website-hero-video-preview">
                      <MediaPreview asset={selectedAsset} videoOnly />
                    </div>
                    <label>
                      Browse video
                      <input accept="video/*" name="media_file" type="file" />
                    </label>
                  </div>

                  <div className="website-form-actions">
                    <button disabled={setupMissing} type="submit">Save video</button>
                  </div>
                </>
              ) : isWhatWeBuildSection ? (
                <>
                  <input name="status" type="hidden" value="published" />
                  <input name="subtitle" type="hidden" value={activeRecord.subtitle || ""} />
                  <input name="media_asset_id" type="hidden" value={activeRecord.media_asset_id || ""} />

                  <label>
                    Main headline
                    <input defaultValue={activeRecord.title || ""} name="title" placeholder="Section headline shown on the website" />
                  </label>

                  <label>
                    Body
                    <textarea defaultValue={activeRecord.body || ""} name="body" placeholder="Short paragraph or section copy" />
                  </label>

                  <label>
                    Brand Deals Signed and Executed
                    <input defaultValue={activeRecord.cta_label || ""} inputMode="numeric" name="cta_label" placeholder="100" />
                  </label>

                  <div className="website-form-actions">
                    <button disabled={setupMissing} type="submit">Save section</button>
                  </div>
                </>
              ) : (
                <>

                  <div className="website-form-grid">
                    <label>
                      Eyebrow / Subtitle
                      <input defaultValue={activeRecord.subtitle || ""} name="subtitle" placeholder="Example: What We Build" />
                    </label>
                    <input name="status" type="hidden" value="published" />
                  </div>

                  <label>
                    Main headline
                    <input defaultValue={activeRecord.title || ""} name="title" placeholder="Section headline shown on the website" />
                  </label>

                  <label>
                    Body copy
                    <textarea defaultValue={activeRecord.body || ""} name="body" placeholder="Short paragraph or section copy" />
                  </label>

                  <div className="website-form-grid">
                    <label>
                      CTA label
                      <input defaultValue={activeRecord.cta_label || ""} name="cta_label" placeholder="Start a Campaign" />
                    </label>
                    <label>
                      CTA link
                      <input defaultValue={activeRecord.cta_url || ""} name="cta_url" placeholder="/contact#inquiry" />
                    </label>
                  </div>

                  <div className="website-media-picker">
                    <div className="website-media-picker-preview">
                      <MediaPreview asset={selectedAsset} />
                    </div>
                    <div className="website-media-fields">
                      <label>
                        Use existing media
                        <select defaultValue={activeRecord.media_asset_id || ""} name="media_asset_id">
                          <option value="">No attached media</option>
                          {mediaAssets.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              {asset.file_name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Or upload new media
                        <input accept="image/*,video/*" name="media_file" type="file" />
                      </label>
                      <div className="website-form-grid">
                        <label>
                          Alt text
                          <input name="media_alt_text" placeholder="Describe the image or video" />
                        </label>
                        <label>
                          Caption
                          <input name="media_caption" placeholder="Optional caption" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="website-form-actions">
                    <button disabled={setupMissing} type="submit">Save section</button>
                    <button
                      disabled={setupMissing}
                      formAction={archivePageSection}
                      type="submit"
                    >
                      Archive
                    </button>
                  </div>
                </>
              )}
            </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export type { PageBlueprint };
