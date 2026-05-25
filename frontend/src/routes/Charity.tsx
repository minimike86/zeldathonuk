import { DonationCards } from '@/components/DonationCards';
import './charity.css';

const SPECIALEFFECT_LEARN = 'https://www.specialeffect.org.uk/what-we-do/our-work';

export function Charity() {
  return (
    <div className="container p-3 min-vh-100 text-white text-center">
      <div className="my-3">
        <div className="mb-5">
          <h1 className="text-bloodmoon text-uppercase">Who are we fundraising for?</h1>
        </div>

        <div>
          <div className="d-flex justify-content-center p-3">
            <a href="https://www.specialeffect.org.uk/" target="_blank" rel="noreferrer">
              <img
                className="w-50"
                src="/assets/img/SE_Logo_Proud_To_Support_White.png"
                alt="SpecialEffect Logo"
              />
            </a>
          </div>

          <div className="d-flex justify-content-center my-5">
            <div className="w-75" style={{ fontSize: '1.25em' }}>
              <a
                className="text-info"
                href="https://www.specialeffect.org.uk/"
                target="_blank"
                rel="noreferrer"
              >
                SpecialEffect
              </a>{' '}
              want everyone to be included. That's why they're transforming the lives
              of physically disabled people right across the world through the
              innovative use of technology. At the heart of their work is a mission to
              maximise fun and quality of life by helping people control video games to
              the best of their abilities, but that's just the start.
            </div>
          </div>

          <div className="embed-responsive-16by9 my-5">
            <iframe
              className="w-75"
              height="470"
              title="SpecialEffect videos"
              src="https://www.youtube-nocookie.com/embed/videoseries?list=PLHsLVX3Ok858h4N9ca2SuQjhqDJQga_cg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="d-flex justify-content-center my-5">
            <div className="w-75">
              <a
                className="btn btn-lg btn-specialeffect text-uppercase me-5"
                style={{ fontSize: '2em' }}
                href={SPECIALEFFECT_LEARN}
                target="_blank"
                rel="noreferrer"
              >
                Can They Help You?
              </a>
            </div>
          </div>

          <div className="my-5">
            <div className="d-flex justify-content-start">
              <h6 className="text-bloodmoon">Make a donation</h6>
            </div>
            <DonationCards />
          </div>
        </div>
      </div>
    </div>
  );
}
