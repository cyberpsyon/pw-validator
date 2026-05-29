import { useState } from 'react';

// Verbatim from _SAFETY_TIPS in app.py. Emphasis colors adapted to the ensō
// palette: #FF1744 -> --red, #00E676 -> --green, #F5A623 -> --vermilion.
const SAFETY_TIPS = [
  ['Use a unique password for every account',
   "When a company gets hacked, attackers take the stolen passwords and try them on other websites like your email, bank, and social media. If you use the <span style='color:var(--red);font-weight:700'>same password everywhere</span>, one breach can compromise all of your accounts. Always use a <span style='color:var(--green);font-weight:700'>different password for each account</span>."],

  ['Use a password manager',
   "Nobody can remember dozens of strong, unique passwords. A <span style='color:var(--vermilion);font-weight:700'>password manager</span> is an app that securely stores all of your passwords for you. You only need to remember <span style='color:var(--green);font-weight:700'>one master password</span>, and the manager fills in the rest. <a href='https://1password.com/' target='_blank' rel='noreferrer'>1Password</a> is the industry-leading option for individuals and teams."],

  ['Enable multi-factor authentication (MFA)',
   "<span style='color:var(--vermilion);font-weight:700'>Multi-factor authentication</span> adds another step when you log in, like a code from an app on your phone or a physical security key. Even if someone steals your password, they still cannot get into your account without that second step. <span style='color:var(--green);font-weight:700'>Turn on MFA everywhere it is available</span>, especially for email, banking, and work accounts. <span style='color:var(--red);font-weight:700'>Avoid SMS-based MFA when possible.</span> Authenticator apps (like Authy or Google Authenticator) and hardware security keys (like <a href='https://www.yubico.com/get-yubikey' target='_blank' rel='noreferrer'>YubiKey</a>) are significantly harder to intercept or bypass."],

  ['Longer passwords are stronger passwords',
   "A <span style='color:var(--vermilion);font-weight:700'>20-character passphrase</span> made of random words (like <span style='color:var(--green);font-weight:700'>\"correct-horse-battery-staple\"</span>) is both stronger and easier to type than a short, complicated password like <span style='color:var(--red);font-weight:700'>\"P@s5w0rd!\"</span>. Aim for <span style='color:var(--vermilion);font-weight:700'>at least 15 characters</span>, but longer is always better."],

  ['Never share passwords over email or chat',
   "No legitimate company, IT department, or government agency will ever ask you for your password. If someone contacts you asking for your password, <span style='color:var(--red);font-weight:700'>it is a scam</span>. Always type your password <span style='color:var(--green);font-weight:700'>directly</span> into the official website or app, <span style='color:var(--red);font-weight:700'>never</span> into an email, text message, or phone call."],

  ['Watch for data breaches',
   "Data breaches happen regularly, and your information may be exposed without you knowing. Sign up for <span style='color:var(--green);font-weight:700'>free alerts</span> at <a href='https://haveibeenpwned.com' target='_blank' rel='noreferrer'>Have I Been Pwned</a> to get notified if your email appears in a breach. When you get an alert, <span style='color:var(--green);font-weight:700'>change the password</span> for that account immediately."],

  ['Change passwords that have been exposed',
   "If you find out that one of your passwords was part of a data breach, <span style='color:var(--green);font-weight:700'>stop using it right away</span> on every account where you used it. Attackers share stolen passwords widely, so a breached password is <span style='color:var(--red);font-weight:700'>never safe to use again</span>, even if you change it slightly."],

  ['A high score does not mean your password is unbreakable',
   "Even if this tool rates your password as \"Excellent\" with a crack time of centuries, <span style='color:var(--red);font-weight:700'>no password is truly permanent</span>. Advances in technology, including <span style='color:var(--vermilion);font-weight:700'>quantum computing</span>, will make password cracking significantly faster in the future. <span style='color:var(--green);font-weight:700'>Combine strong passwords with MFA</span> and change a password only when you have reason to believe it has been compromised. Routine rotation tends to produce weaker, predictable passwords and is no longer recommended."],
];

function Tip({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tip">
      <button type="button" className="tip-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="disclosure-mark">{open ? '−' : '+'}</span>
        {title}
      </button>
      {open && <p className="tip-body" dangerouslySetInnerHTML={{ __html: body }} />}
    </div>
  );
}

export function SafetyTips() {
  const [open, setOpen] = useState(false);

  return (
    <section className="safety-tips">
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className="disclosure-mark">{open ? '−' : '+'}</span>
        Safety tips
      </button>

      {open && (
        <div className="tips-list">
          {SAFETY_TIPS.map(([title, body]) => (
            <Tip key={title} title={title} body={body} />
          ))}
        </div>
      )}
    </section>
  );
}
