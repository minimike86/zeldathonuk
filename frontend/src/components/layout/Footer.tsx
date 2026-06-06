import { Link } from 'react-router';
import './footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="d-flex justify-content-center h-100">
        <div className="d-flex align-self-center mx-2">
          <span className="footer-text">&copy; 2011-{new Date().getFullYear()} ZeldathonUK</span>
        </div>
        <div className="d-flex align-self-center text-muted mx-2">
          <Link className="footer-text" to="/terms">
            Terms
          </Link>
        </div>
        <div className="d-flex align-self-center text-muted mx-2">
          <Link className="footer-text" to="/privacy">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
