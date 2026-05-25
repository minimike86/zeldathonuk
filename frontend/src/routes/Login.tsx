import { useState } from 'react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    // Auth backend not wired yet — placeholder for Clerk integration.
    console.warn('Login submitted but auth is disabled.', { email });
  };

  return (
    <div className="container mt-3">
      <div className="row d-flex justify-content-center">
        <div className="card border-primary w-50">
          <div className="card-header d-flex pb-1">
            <img
              className="align-self-center"
              src="https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg"
              alt="Google"
            />
            <span className="align-self-center ms-1 mb-1" style={{ fontSize: 'large' }}>
              Account
            </span>
          </div>
          <div className="card-body bg-light">
            <div className="form-group">
              <label className="col-form-label col-form-label-lg" htmlFor="inputEmail">
                Email:
              </label>
              <input
                className="form-control form-control-lg"
                type="text"
                placeholder="email.address@gmail.com"
                id="inputEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label
                className="col-form-label col-form-label-lg"
                htmlFor="inputPassword"
              >
                Password:
              </label>
              <input
                className="form-control form-control-lg"
                type="password"
                placeholder="Password"
                id="inputPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group text-center">
              <button
                className="btn btn-lg btn-primary my-2 w-50"
                type="submit"
                onClick={submit}
                title="Login with your Google Account"
              >
                Login with Google
              </button>
            </div>
          </div>
          <div className="card-footer">
            <span className="small">
              By logging in using your Google account you agree to our{' '}
              <span className="text-info" role="button" tabIndex={0}>
                privacy policy
              </span>{' '}
              and{' '}
              <span className="text-info" role="button" tabIndex={0}>
                terms of service
              </span>
              . Google provide us with your name, email address and profile picture. You
              can revoke our access to your account data any time from your{' '}
              <a
                className="text-muted"
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noreferrer"
              >
                <span className="text-primary">G</span>
                <span className="text-danger">o</span>
                <span className="text-warning">o</span>
                <span className="text-primary">g</span>
                <span className="text-success">l</span>
                <span className="text-danger">e</span> Account
              </a>
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
