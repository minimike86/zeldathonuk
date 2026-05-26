import { DonationCards } from '@/components/DonationCards';
import './charity.css';

const SPECIALEFFECT_LEARN = 'https://www.specialeffect.org.uk/what-we-do/our-work';

export function Charity() {
  return (
    <div className="charity-page container py-3 text-white">
      <header className="charity-header">
        <h1 className="charity-title">Who are we fundraising for?</h1>
        <a
          className="charity-logo"
          href="https://www.specialeffect.org.uk/"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="/assets/img/SE_Logo_Proud_To_Support_White.png"
            alt="SpecialEffect Logo"
          />
        </a>
      </header>

      <div className="charity-panel charity-shell-body">
        <div className="charity-side">
          <span className="charity-cta-eyebrow charity-side-eyebrow">
            Meet our charity partner
          </span>
          <p className="charity-blurb m-0">
            <a
              className="text-info"
              href="https://www.specialeffect.org.uk/"
              target="_blank"
              rel="noreferrer"
            >
              SpecialEffect
            </a>{' '}
            wants everyone to be included. They're transforming the lives of
            physically disabled people across the world through the innovative
            use of technology — at the heart of their work is a mission to
            maximise fun and quality of life by helping people control video
            games to the best of their abilities, but that's just the start.
          </p>

          <div className="charity-actions">
            <a
              className="charity-cta charity-cta--learn"
              href={SPECIALEFFECT_LEARN}
              target="_blank"
              rel="noreferrer"
            >
              <span className="charity-cta-eyebrow">Need support?</span>
              <span className="charity-cta-title">Can they help you?</span>
              <span className="charity-cta-sub">
                Free assessments, workshops &amp; assistive tech.
              </span>
            </a>

            <DonationCards>
              <span className="charity-cta charity-cta--donate">
                <span className="charity-cta-eyebrow">Power their work</span>
                <span className="charity-cta-title">Make a donation</span>
                <span className="charity-cta-sub">
                  Every pound goes straight into accessible gaming kit.
                </span>
              </span>
            </DonationCards>
          </div>
        </div>

        <div className="charity-side charity-video">
          <span className="charity-cta-eyebrow charity-video-eyebrow">
            Watch SpecialEffect at work
          </span>
          <div className="charity-video-frame">
            <iframe
              title="SpecialEffect videos"
              src="https://www.youtube-nocookie.com/embed/videoseries?list=PLHsLVX3Ok858h4N9ca2SuQjhqDJQga_cg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
