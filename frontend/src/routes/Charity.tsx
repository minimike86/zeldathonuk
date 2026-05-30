import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXTwitter,
  faFacebookF,
  faInstagram,
  faYoutube,
  faTiktok,
  faLinkedinIn,
  faBluesky,
  faThreads,
  faMastodon,
  faTwitch,
  faDiscord,
  faRedditAlien,
  faPatreon,
} from '@fortawesome/free-brands-svg-icons';
import { faLink, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type {
  Charity,
  CharityImpactTier,
  CharityVideo,
  DonationPage,
  EventCharityLink,
  SocialPlatformKey,
} from '@/lib/obsApi';
import { DonateButton } from '@/components/donations/DonateButton';
import { useAccentDeck } from '@/lib/accentDeck';
import { formatTierAmount } from '@/lib/currency';
import './charity.css';

/** Brand icon + display label per supported social platform. Keys match
 *  the backend `SocialPlatform.choices` enum; `other` falls back to a
 *  generic link glyph so a custom platform still renders. */
const SOCIAL_META: Record<
  SocialPlatformKey,
  { icon: IconDefinition; label: string }
> = {
  twitter: { icon: faXTwitter, label: 'X / Twitter' },
  facebook: { icon: faFacebookF, label: 'Facebook' },
  instagram: { icon: faInstagram, label: 'Instagram' },
  youtube: { icon: faYoutube, label: 'YouTube' },
  tiktok: { icon: faTiktok, label: 'TikTok' },
  linkedin: { icon: faLinkedinIn, label: 'LinkedIn' },
  bluesky: { icon: faBluesky, label: 'Bluesky' },
  threads: { icon: faThreads, label: 'Threads' },
  mastodon: { icon: faMastodon, label: 'Mastodon' },
  twitch: { icon: faTwitch, label: 'Twitch' },
  discord: { icon: faDiscord, label: 'Discord' },
  reddit: { icon: faRedditAlien, label: 'Reddit' },
  patreon: { icon: faPatreon, label: 'Patreon' },
  other: { icon: faLink, label: 'Link' },
};

/** Extract a YouTube video id from any of the URL flavours YouTube
 *  emits (watch?v=, youtu.be/, embed/, shorts/). Returns null when the
 *  URL is from a different host or can't be parsed. */
function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (!u.hostname.endsWith('youtube.com') && !u.hostname.endsWith('youtube-nocookie.com')) {
      return null;
    }
    const v = u.searchParams.get('v');
    if (v) return v;
    const m = u.pathname.match(/\/(embed|shorts|v)\/([^/?]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

function videoThumbnail(v: CharityVideo): string | null {
  if (v.thumbnail_url) return v.thumbnail_url;
  const ytId = youtubeId(v.url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

/** Render a CharityImpactTier description: HTML override when set,
 *  plain text otherwise. The HTML payload is curator-supplied via
 *  /control/charities and is rendered verbatim — that matches how the
 *  same field works on /donations. */
function ImpactTierDescription({ tier }: { tier: CharityImpactTier }) {
  if (tier.description_html.trim()) {
    return (
      <span
        className="charity-impact-desc"
        dangerouslySetInnerHTML={{ __html: tier.description_html }}
      />
    );
  }
  return <span className="charity-impact-desc">{tier.description}</span>;
}

export function Charity() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 30_000);
  const donationPages = event?.donation_pages ?? [];
  const benefitting = useMemo(
    () =>
      [...(event?.event_charities ?? [])].sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.order - b.order;
      }),
    [event?.event_charities],
  );

  return (
    <div className="charity-page container py-3 text-white">
      <header className="charity-header">
        <h1 className="charity-title">Who are we fundraising for?</h1>
        {event && (
          <span className="charity-event-tag">
            {event.name}
          </span>
        )}
      </header>

      {benefitting.length === 0 ? (
        <div className="charity-panel text-center py-5 text-white-50">
          <p className="m-0">
            No beneficiary linked to the current event yet — check back soon.
          </p>
        </div>
      ) : (
        benefitting.map((link) => (
          <CharityBlock
            key={link.id}
            link={link}
            showPrimaryBadge={benefitting.length > 1}
            donationPages={donationPages}
            currencySymbol={event?.currency_symbol}
          />
        ))
      )}
    </div>
  );
}

function CharityBlock({
  link,
  showPrimaryBadge,
  donationPages,
  currencySymbol,
}: {
  link: EventCharityLink;
  showPrimaryBadge: boolean;
  /** Donation pages from the active event. When present, the donate CTA
   *  opens the picker modal (fundraising page links); when empty (no
   *  active event) it falls back to the charity's direct donate URL. */
  donationPages: DonationPage[];
  currencySymbol?: string;
}) {
  const charity = link.charity_detail;
  const hasFundraisingPages = donationPages.length > 0;
  const helpUrl =
    charity.help_cta_url.trim() || charity.primary_website_url.trim() || '';
  const helpHeadline = charity.help_cta_headline.trim() || 'Can they help you?';
  const helpBody =
    charity.help_cta_body.trim() ||
    'Free assessments, workshops & assistive tech.';
  const donateHeadline =
    charity.donate_cta_headline.trim() || 'Make a donation';
  const donateBody =
    charity.donate_cta_body.trim() ||
    'Every pound goes straight to the cause.';

  return (
    <section className="charity-block">
      <CharityHero charity={charity} showPrimaryBadge={showPrimaryBadge && link.is_primary} />

      <div className="charity-panel charity-shell-body">
        <div className="charity-side">
          <span className="charity-cta-eyebrow charity-side-eyebrow">
            About {charity.short_name || charity.name}
          </span>
          <p className="charity-blurb m-0">{charity.mission_statement}</p>

          <div className="charity-actions">
            {helpUrl && (
              <a
                className="charity-cta charity-cta--learn"
                href={helpUrl}
                target="_blank"
                rel="noreferrer"
                title={helpBody}
              >
                <span className="charity-cta-title">{helpHeadline}</span>
              </a>
            )}

            {hasFundraisingPages ? (
              // Active event with fundraising pages → open the picker modal
              // so viewers get the per-platform fundraising page links.
              <DonateButton
                pages={donationPages}
                currencySymbol={currencySymbol}
                className="donate-trigger-reset"
              >
                <span className="charity-cta charity-cta--donate" title={donateBody}>
                  <span className="charity-cta-title">{donateHeadline}</span>
                </span>
              </DonateButton>
            ) : charity.donate_cta_url ? (
              // No active event → fall back to the charity's own evergreen
              // donate page.
              <a
                className="charity-cta charity-cta--donate"
                href={charity.donate_cta_url}
                target="_blank"
                rel="noreferrer"
                title={donateBody}
              >
                <span className="charity-cta-title">{donateHeadline}</span>
              </a>
            ) : null}
          </div>
        </div>

        <CharityLinks charity={charity} />
      </div>

      {charity.impact_tiers.length > 0 && <ImpactTiers charity={charity} />}
      {charity.videos.length > 0 && <VideoGallery videos={charity.videos} />}
      {charity.images.length > 0 && <ImageGallery charity={charity} />}
    </section>
  );
}

function CharityHero({
  charity,
  showPrimaryBadge,
}: {
  charity: Charity;
  showPrimaryBadge: boolean;
}) {
  return (
    <div
      className={`charity-hero${charity.banner_url ? ' charity-hero--banner' : ''}`}
      style={
        charity.banner_url
          ? { backgroundImage: `url(${charity.banner_url})` }
          : undefined
      }
    >
      {charity.logo_url && (
        <a
          className="charity-hero-logo"
          href={charity.primary_website_url || undefined}
          target={charity.primary_website_url ? '_blank' : undefined}
          rel="noreferrer"
          title={charity.name}
        >
          <img src={charity.logo_url} alt={`${charity.name} logo`} />
        </a>
      )}
      <div className="charity-hero-meta">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <h2 className="charity-hero-name m-0">{charity.name}</h2>
          {showPrimaryBadge && (
            <span className="charity-hero-badge">Primary beneficiary</span>
          )}
        </div>
        {charity.short_name && charity.short_name !== charity.name && (
          <div className="charity-hero-sub">{charity.short_name}</div>
        )}
        {charity.charity_number && (
          <div className="charity-hero-number">
            Registered charity no. <strong>{charity.charity_number}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

/** Right column of the hero panel: social pills + additional website
 *  links. Falls back to a "connect" hint when neither is populated so
 *  the column doesn't collapse to a void on minimal charity records. */
function CharityLinks({ charity }: { charity: Charity }) {
  const socials = [...charity.social_links].sort((a, b) => a.order - b.order);
  const websites = [...charity.websites].sort((a, b) => a.order - b.order);
  const hasAny =
    socials.length > 0 || websites.length > 0 || !!charity.primary_website_url;

  return (
    <div className="charity-side charity-side--links">
      <span className="charity-cta-eyebrow charity-side-eyebrow">
        Connect with {charity.short_name || charity.name}
      </span>

      {!hasAny ? (
        <p className="charity-blurb text-white-50 m-0">No links yet.</p>
      ) : (
        <>
          {socials.length > 0 && (
            <ul className="charity-social-list">
              {socials.map((s) => {
                const meta = SOCIAL_META[s.platform];
                return (
                  <li key={s.id}>
                    <a
                      className="charity-social-pill"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${meta.label}${s.handle ? ` — ${s.handle}` : ''}`}
                    >
                      <span className="charity-social-glyph">
                        <FontAwesomeIcon icon={meta.icon} />
                      </span>
                      <span className="charity-social-text">
                        <span className="charity-social-platform">
                          {meta.label}
                        </span>
                        <span className="charity-social-handle">
                          {s.handle || s.platform_label}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          {(charity.primary_website_url || websites.length > 0) && (
            <ul className="charity-link-list">
              {charity.primary_website_url && (
                <li>
                  <a
                    className="charity-link"
                    href={charity.primary_website_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                    <span>Main website</span>
                  </a>
                </li>
              )}
              {websites.map((w) => (
                <li key={w.id}>
                  <a
                    className="charity-link"
                    href={w.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                    <span>{w.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ImpactTiers({ charity }: { charity: Charity }) {
  const tiers = [...charity.impact_tiers].sort((a, b) => a.order - b.order);
  // Per-tier shuffled accents — every "what could your donation do?"
  // tile picks one of the four theme colours so the grid reads as the
  // full PAL palette rather than a uniform brand-coloured row.
  const tierAccents = useAccentDeck(tiers.length);
  return (
    <section className="charity-impact">
      <header className="charity-section-header">
        <span className="charity-cta-eyebrow charity-side-eyebrow">
          What could your donation do?
        </span>
      </header>
      <div className="charity-impact-grid">
        {tiers.map((t, i) => (
          <div
            key={t.id}
            className="charity-impact-tier"
            data-accent={tierAccents[i]}
          >
            <div className="charity-impact-amount">
              {formatTierAmount(t.amount, t.currency)}
            </div>
            {t.image_url && (
              <img
                className="charity-impact-img"
                src={t.image_url}
                alt={t.alt_text || ''}
                loading="lazy"
              />
            )}
            <ImpactTierDescription tier={t} />
          </div>
        ))}
      </div>
    </section>
  );
}

function VideoGallery({ videos }: { videos: CharityVideo[] }) {
  const sorted = [...videos].sort((a, b) => a.order - b.order);
  // Pick the first YouTube video as the featured embed so the section
  // opens with something playing in-place; the rest render as click-out
  // cards. Avoids embedding N iframes that all autoplay-fight for
  // bandwidth.
  const featured = sorted.find((v) => youtubeId(v.url)) ?? null;
  const featuredId = featured ? youtubeId(featured.url) : null;
  const rest = sorted.filter((v) => v !== featured);

  return (
    <section className="charity-videos">
      <header className="charity-section-header">
        <span className="charity-cta-eyebrow charity-video-eyebrow">
          Watch their work
        </span>
      </header>

      {featured && featuredId && (
        <div className="charity-panel charity-panel--flush">
          <div className="charity-video-frame">
            <iframe
              title={featured.title}
              src={`https://www.youtube-nocookie.com/embed/${featuredId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {(featured.description || featured.title) && (
            <div className="charity-video-caption">
              <strong>{featured.title}</strong>
              {featured.description && (
                <p className="m-0 small text-white-50">
                  {featured.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <div className="charity-video-grid">
          {rest.map((v) => {
            const thumb = videoThumbnail(v);
            return (
              <a
                key={v.id}
                className="charity-video-card"
                href={v.url}
                target="_blank"
                rel="noreferrer"
                title={v.title}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    className="charity-video-thumb"
                  />
                ) : (
                  <div className="charity-video-thumb charity-video-thumb--empty">
                    <FontAwesomeIcon icon={faYoutube} />
                  </div>
                )}
                <div className="charity-video-info">
                  <strong>{v.title}</strong>
                  {v.description && (
                    <span className="small text-white-50">
                      {v.description}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Image gallery — masonry-ish grid with a configurable cap so a charity
 *  with 50 photos doesn't dump the entire archive on the page. The
 *  "show more" toggle reveals the rest in-place; we don't bother with
 *  a lightbox — clicking an image opens the full asset in a new tab. */
function ImageGallery({ charity }: { charity: Charity }) {
  const images = [...charity.images].sort((a, b) => a.order - b.order);
  const INITIAL = 8;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? images : images.slice(0, INITIAL);
  const overflow = images.length - INITIAL;

  return (
    <section className="charity-gallery">
      <header className="charity-section-header">
        <span className="charity-cta-eyebrow charity-video-eyebrow">
          From the workshop floor
        </span>
        <span className="text-white-50 small">
          {images.length} image{images.length === 1 ? '' : 's'}
        </span>
      </header>
      <div className="charity-gallery-grid">
        {visible.map((img) => (
          <a
            key={img.id}
            className="charity-gallery-tile"
            href={img.image_url}
            target="_blank"
            rel="noreferrer"
            title={img.caption || img.alt_text || charity.name}
          >
            <img
              src={img.image_url}
              alt={img.alt_text || ''}
              loading="lazy"
            />
            {img.caption && (
              <span className="charity-gallery-caption">{img.caption}</span>
            )}
          </a>
        ))}
      </div>
      {overflow > 0 && (
        <button
          type="button"
          className="charity-gallery-more"
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? 'Show fewer' : `Show ${overflow} more`}
        </button>
      )}
    </section>
  );
}
