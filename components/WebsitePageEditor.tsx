"use client";

import { useMemo, useState } from "react";
import { archivePageSection, deletePartnerLogo, savePageSection, uploadPartnerLogo } from "@/app/(admin)/cms/pages/actions";

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

const emptyRecord: Omit<PageSectionRecord, "page_key" | "section_key" | "sort_order"> = {
  title: "",
  subtitle: "",
  body: "",
  cta_label: "",
  cta_url: "",
  media_asset_id: "",
  status: "draft"
};

const partnerBrandNames = [
  "DQ",
  "Old Spice",
  "Globe",
  "KTO",
  "Disney",
  "Food Panda",
  "Jollibee",
  "Skin1004",
  "Dr. Wong's",
  "Coins.ph",
  "Shopee",
  "Amplify",
  "In Circle",
  "Nestle",
  "P&G",
  "Pantene",
  "Olay",
  "BDO",
  "Lazada",
  "SUI SUI",
  "Nivea",
  "CeraVe"
];

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
  disabled
}: {
  asset?: MediaAsset;
  brandName: string;
  disabled: boolean;
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
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        type="file"
      />
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

  const recordsByKey = useMemo(() => {
    return new Map(sections.map((section) => [getRecordKey(section.page_key, section.section_key), section]));
  }, [sections]);

  const mediaById = useMemo(() => {
    return new Map(mediaAssets.map((asset) => [asset.id, asset]));
  }, [mediaAssets]);
  const logosByName = useMemo(() => {
    return new Map(clientLogos.map((logo) => [logo.brand_name.toLowerCase(), logo]));
  }, [clientLogos]);
  const partnerLogoRows = useMemo(() => {
    const baseRows = partnerBrandNames.map((brandName, index) => ({
      brandName,
      sortOrder: index + 1,
      logo: logosByName.get(brandName.toLowerCase())
    }));
    const customRows = clientLogos
      .filter((logo) => !partnerBrandNames.some((brandName) => brandName.toLowerCase() === logo.brand_name.toLowerCase()))
      .map((logo, index) => ({
        brandName: logo.brand_name,
        sortOrder: partnerBrandNames.length + index + 1,
        logo
      }));

    return [...baseRows, ...customRows];
  }, [clientLogos, logosByName]);

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
                {partnerLogoRows.map(({ brandName, logo, sortOrder }) => {
                  const logoAsset = logo?.logo_media_id ? mediaById.get(logo.logo_media_id) : undefined;

                  return (
                    <div className="partner-logo-row" key={brandName}>
                      <strong>{brandName}</strong>
                      <form action={uploadPartnerLogo} className="partner-logo-upload-form">
                        <input name="brand_name" type="hidden" value={brandName} />
                        <input name="logo_id" type="hidden" value={logo?.id || ""} />
                        <input name="sort_order" type="hidden" value={sortOrder} />
                        <PartnerLogoTile asset={logoAsset} brandName={brandName} disabled={setupMissing} />
                      </form>
                      <form action={deletePartnerLogo}>
                        <input name="logo_id" type="hidden" value={logo?.id || ""} />
                        <button disabled={setupMissing || !logo?.id} type="submit">Delete</button>
                      </form>
                    </div>
                  );
                })}
              </div>
              {isAddPartnerOpen ? (
                <div className="partner-modal-backdrop">
                  <form action={uploadPartnerLogo} className="partner-modal">
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
                        <span>Upload logo</span>
                        <input accept="image/*" name="logo_file" required type="file" />
                      </label>
                    </div>
                    <button disabled={setupMissing} type="submit">Add brand</button>
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
