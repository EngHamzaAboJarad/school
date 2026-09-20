import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileUp,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";

const flowLabels = {
  parent: [
    "Parent details",
    "Student details",
    "School & grade",
    "Review & consent",
  ],
  student: ["School context", "Student details", "Review & consent"],
  teacher: [
    "Personal details",
    "Qualifications & experience",
    "Documents",
    "Review & submit",
  ],
};

export default function AuthScreen({ onLogin }) {
  const [screen, setScreen] = useState("signin");
  const [role, setRole] = useState("");
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState("en");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState({});
  const [profile, setProfile] = useState("");
  const [loginRole, setLoginRole] = useState("طالب");
  const labels = flowLabels[role] || [];
  const isArabic = language === "ar";
  const goBack = () => {
    if (["signin", "account-type", "forgot", "profiles"].includes(screen))
      return setScreen(screen === "signin" ? "signin" : "signin");
    if (screen === "2fa") return setScreen("profiles");
    if (
      [
        "parent-success",
        "teacher-pending",
        "student-success",
        "verification-success",
        "password-updated",
      ].includes(screen)
    )
      return setScreen("signin");
    if (screen === "recovery") return setScreen("forgot");
    if (screen === "reset") return setScreen("recovery");
    if (step > 1) return setStep(step - 1);
    setScreen("account-type");
  };
  const next = () =>
    step < labels.length
      ? setStep(step + 1)
      : setScreen(
          role === "teacher"
            ? "teacher-pending"
            : role === "parent"
              ? "parent-success"
              : "student-success",
        );
  const submitLogin = (event) => {
    event.preventDefault();
    const email = event.currentTarget.elements.email.value.trim().toLowerCase();
    const demoRoles = {
      "student@taqat.test": "طالب",
      "parent@taqat.test": "ولي أمر",
      "teacher@taqat.test": "معلم",
      "admin@taqat.test": "إدارة",
    };
    setLoginRole(demoRoles[email] || "طالب");
    setScreen("2fa");
  };
  const context = {
    screen,
    role,
    step,
    labels,
    profile,
    setRole,
    setStep,
    setScreen,
    next,
    goBack,
    consent,
    setConsent,
    files,
    setFiles,
    showPassword,
    setShowPassword,
    submitLogin,
    loginRole,
    onLogin,
  };

  return (
    <main
      className={`auth-screen auth-reference ${isArabic ? "auth-arabic" : ""}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <section className="auth-art">
        <div className="auth-brand">
          <span>
            <Zap size={18} fill="currentColor" />
          </span>
          <strong>Taqat School</strong>
        </div>
        <div className="auth-art-copy">
          <div className="hero-kicker">
            <Sparkles size={16} />{" "}
            {isArabic ? "تعليم آمن وذكي" : "Secure learning access"}
          </div>
          <h1>
            {isArabic ? (
              <>
                بوابة آمنة
                <br />
                <em>لرحلة التعلم</em>
              </>
            ) : (
              <>
                One secure
                <br />
                gateway for your
                <br />
                <em>learning journey</em>
              </>
            )}
          </h1>
          <p>
            {isArabic
              ? "وصول آمن للطلاب وأولياء الأمور والمعلمين مع التحقق بخطوتين وصلاحيات حسب الدور."
              : "Secure access for students, parents and teachers, with two-factor verification and role-based access."}
          </p>
          <div className="auth-pills">
            <span>2FA</span>
            <span>Role-based access</span>
            <span>AR / EN</span>
          </div>
        </div>
        <div className="auth-orbit orbit-auth-one" />
        <div className="auth-orbit orbit-auth-two" />
      </section>
      <section className="auth-panel">
        <button
          className="language-button"
          onClick={() => setLanguage(isArabic ? "en" : "ar")}
        >
          {isArabic ? "English" : "العربية"}
        </button>
        <div className="auth-panel-inner auth-reference-inner">
          {renderScreen(context)}
        </div>
      </section>
    </main>
  );
}

function renderScreen(context) {
  const {
    screen,
    role,
    step,
    labels,
    setRole,
    setStep,
    setScreen,
    next,
    goBack,
    consent,
    setConsent,
    files,
    setFiles,
    showPassword,
    setShowPassword,
    submitLogin,
    onLogin,
    profile,
    loginRole,
  } = context;
  if (screen === "signin")
    return (
      <SignIn
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onSubmit={submitLogin}
        onForgot={() => setScreen("forgot")}
        onCreate={() => setScreen("account-type")}
        onGoogle={() => setScreen("profiles")}
      />
    );
  if (screen === "account-type")
    return (
      <AccountType
        setRole={(value) => {
          setRole(value);
          setStep(1);
          setScreen(value === "teacher" ? "teacher-flow" : "registration-flow");
        }}
        onBack={goBack}
      />
    );
  if (screen === "profiles")
    return (
      <ProfileChoice
        setProfile={(value) => {
          setRole(value === "Teacher" ? "teacher" : "parent");
          setProfile(value);
          setScreen("2fa");
        }}
        onBack={goBack}
      />
    );
  if (screen === "2fa")
    return (
      <TwoFactor
        onVerify={() => setScreen("verification-success")}
        onBack={goBack}
      />
    );
  if (screen === "verification-success")
    return (
      <StatusScreen
        icon={<Check />}
        title="Verification successful"
        body="You will be routed to the dashboard matching the backend-approved profile and role."
        action="Finish preview"
        onAction={() =>
          onLogin(
            profile === "Teacher"
              ? "معلم"
              : profile === "Parent"
                ? "ولي أمر"
                : role === "teacher"
                  ? "معلم"
                  : role === "parent"
                    ? "ولي أمر"
                    : loginRole,
          )
        }
      />
    );
  if (screen === "forgot")
    return <Forgot onContinue={() => setScreen("recovery")} onBack={goBack} />;
  if (screen === "recovery")
    return (
      <StatusScreen
        icon={<Check />}
        title="Check your recovery channel"
        body="If the account exists and is eligible, recovery instructions will be sent. The reset token is valid for 15 minutes and single-use."
        action="Preview new password screen"
        onAction={() => setScreen("reset")}
      />
    );
  if (screen === "reset")
    return <Reset onSave={() => setScreen("password-updated")} />;
  if (screen === "password-updated")
    return (
      <StatusScreen
        icon={<Check />}
        title="Password updated"
        body="Existing active sessions are revoked. Sign in again with the new password."
        action="Sign in"
        onAction={() => setScreen("signin")}
      />
    );
  if (screen === "parent-success")
    return (
      <StatusScreen
        icon={<Check />}
        title="Registration created"
        body="The parent-student relationship has been created within the approved school context."
        action="Sign in"
        onAction={() => setScreen("signin")}
      />
    );
  if (screen === "student-success")
    return (
      <StatusScreen
        icon={<Check />}
        title="Registration created"
        body="Your student profile is ready for school approval and secure sign-in."
        action="Sign in"
        onAction={() => setScreen("signin")}
      />
    );
  if (screen === "teacher-pending")
    return (
      <StatusScreen
        icon={<Timer />}
        tone="pending"
        title="Teacher application under review"
        body="The teacher account is not activated until the application is approved."
        action="Back"
        onAction={() => setScreen("signin")}
      />
    );
  if (screen === "registration-flow" || screen === "teacher-flow")
    return (
      <RegistrationFlow
        role={role}
        step={step}
        labels={labels}
        consent={consent}
        setConsent={setConsent}
        files={files}
        setFiles={setFiles}
        next={next}
        onBack={goBack}
      />
    );
  return null;
}

function AuthFrame({ eyebrow, title, body, children, step, labels, onBack }) {
  return (
    <div className="auth-flow">
      <div className="auth-progress-label">
        <span>
          Step {step} of {labels.length}
        </span>
        <span>{Math.round((step / labels.length) * 100)}%</span>
      </div>
      <div className="auth-progress">
        {labels.map((item, index) => (
          <i className={index < step ? "filled" : ""} key={item} />
        ))}
      </div>
      <span className="auth-overline">{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p className="auth-muted">{body}</p>}
      {children}
      <div className="auth-nav">
        <button className="auth-secondary" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    </div>
  );
}
function SignIn({
  showPassword,
  setShowPassword,
  onSubmit,
  onForgot,
  onCreate,
  onGoogle,
}) {
  return (
    <div className="auth-flow">
      <span className="auth-overline">Welcome back</span>
      <h2>Sign in</h2>
      <p className="auth-muted">
        Enter your account details to access your dashboard.
      </p>
      <div className="demo-accounts">
        <strong>Demo accounts</strong>
        <span>student@taqat.test</span>
        <span>parent@taqat.test</span>
        <span>teacher@taqat.test</span>
        <span>admin@taqat.test</span>
        <small>Password: password • 2FA: 123456</small>
      </div>
      <form onSubmit={onSubmit} className="auth-form">
        <label>
          Email or login
          <input
            name="email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              defaultValue="password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <div className="auth-options">
          <label className="check-label">
            <input type="checkbox" /> Remember me
          </label>
          <button type="button" className="link-button" onClick={onForgot}>
            Forgot password?
          </button>
        </div>
        <button className="auth-submit" type="submit">
          Sign in
        </button>
      </form>
      <div className="auth-divider">or</div>
      <button className="google-button" type="button" onClick={onGoogle}>
        G <strong>Continue with Google</strong>
      </button>
      <p className="auth-footer">
        Don&apos;t have an account?{" "}
        <button type="button" className="link-button" onClick={onCreate}>
          Create account
        </button>
      </p>
    </div>
  );
}
function AccountType({ setRole, onBack }) {
  return (
    <AuthFrame
      eyebrow="Create account"
      title="Choose account type"
      body="Choose an account type to continue with the correct registration flow."
      step={1}
      labels={["Account type"]}
      onBack={onBack}
    >
      <div className="account-types">
        {[
          ["student", "Student", "Within a school and parent context."],
          [
            "parent",
            "Parent",
            "Create the parent first, then link the student.",
          ],
          ["teacher", "Teacher", "Application subject to review and approval."],
        ].map(([value, title, body]) => (
          <button key={value} onClick={() => setRole(value)}>
            <b>{title[0]}</b>
            <strong>{title}</strong>
            <span>{body}</span>
          </button>
        ))}
      </div>
      <div className="info-note">
        Administrative accounts are not created through public
        self-registration.
      </div>
    </AuthFrame>
  );
}
function RegistrationFlow({
  role,
  step,
  labels,
  consent,
  setConsent,
  files,
  setFiles,
  next,
  onBack,
}) {
  const teacher = role === "teacher";
  const title = teacher
    ? [
        "Personal details",
        "Qualifications & experience",
        "Documents",
        "Review your application",
      ][step - 1]
    : [
        "Parent details",
        "Student details",
        "School & grade",
        "Review & consent",
      ][step - 1];
  const eyebrow = teacher
    ? "Teacher application"
    : "Parent & student registration";
  if (!teacher && step === 1)
    return (
      <AuthFrame
        eyebrow={eyebrow}
        title={title}
        body="We create the parent account first, then add and link the student."
        step={step}
        labels={labels}
        onBack={onBack}
      >
        <div className="auth-form">
          <label>
            Email
            <input type="email" placeholder="parent@example.com" />
          </label>
          <label>
            Phone number
            <input placeholder="+966 5X XXX XXXX" />
          </label>
          <label>
            Password
            <input type="password" />
          </label>
        </div>
        <FlowButtons onNext={next} onBack={onBack} />
      </AuthFrame>
    );
  if (!teacher && step === 2)
    return (
      <AuthFrame
        eyebrow={eyebrow}
        title={title}
        body="Add the student’s basic details and link them to this parent."
        step={step}
        labels={labels}
        onBack={onBack}
      >
        <div className="auth-form">
          <label>
            Student name
            <input />
          </label>
          <label>
            Student login
            <input placeholder="student.login" />
          </label>
          <div className="info-note">
            Uniqueness and the final login identifier are validated by the
            backend.
          </div>
        </div>
        <FlowButtons onNext={next} onBack={onBack} />
      </AuthFrame>
    );
  if (!teacher && step === 3)
    return (
      <AuthFrame
        eyebrow={eyebrow}
        title={title}
        body="School comes from an approved registration context, and grade is validated against that school."
        step={step}
        labels={labels}
        onBack={onBack}
      >
        <div className="auth-form">
          <label>
            School code / invitation
            <input />
          </label>
          <label>
            Grade
            <select>
              <option>Select grade</option>
              <option>Grade 1</option>
              <option>Grade 3</option>
              <option>Grade 6</option>
              <option>Grade 9</option>
            </select>
          </label>
        </div>
        <FlowButtons onNext={next} onBack={onBack} />
      </AuthFrame>
    );
  if (teacher && step === 1)
    return (
      <AuthFrame
        eyebrow={eyebrow}
        title={title}
        step={step}
        labels={labels}
        onBack={onBack}
      >
        <div className="two-fields auth-form">
          <label>
            Full name
            <input />
          </label>
          <label>
            Date of birth
            <input type="date" />
          </label>
          <label>
            Gender
            <select>
              <option>Select</option>
              <option>Female</option>
              <option>Male</option>
            </select>
          </label>
          <label>
            Phone
            <input />
          </label>
          <label className="span-two">
            Email
            <input type="email" />
          </label>
          <label className="span-two">
            Password
            <input type="password" />
          </label>
        </div>
        <FlowButtons onNext={next} onBack={onBack} single />
      </AuthFrame>
    );
  if (teacher && step === 2)
    return (
      <AuthFrame
        eyebrow={eyebrow}
        title={title}
        step={step}
        labels={labels}
        onBack={onBack}
      >
        <div className="auth-form">
          <label>
            Qualification
            <input />
          </label>
          <button className="add-button" type="button">
            + Add another qualification
          </button>
          <div className="experience-box">
            <b>Experience</b>
            <label>
              Organization
              <input />
            </label>
            <label>
              Position
              <input />
            </label>
            <div className="two-fields">
              <input type="date" />
              <input type="date" />
            </div>
          </div>
        </div>
        <FlowButtons onNext={next} onBack={onBack} />
      </AuthFrame>
    );
  if (teacher && step === 3)
    return (
      <AuthFrame
        eyebrow={eyebrow}
        title={title}
        body="Identity and academic certificate are required. Experience certificate and personal photo are conditional."
        step={step}
        labels={labels}
        onBack={onBack}
      >
        <div className="upload-list">
          {[
            ["identity", "Identity — PDF / JPG / PNG", true],
            ["academic", "Academic certificate — PDF / JPG / PNG", true],
            ["experience", "Experience certificate — when applicable", false],
            ["photo", "Personal photo — JPG / PNG, when applicable", false],
          ].map(([key, label, required]) => (
            <label className="upload-box" key={key}>
              <FileUp size={17} /> {files[key] || `Upload ${label}`}{" "}
              {required && <small>required</small>}
              <input
                type="file"
                onChange={(event) =>
                  setFiles({
                    ...files,
                    [key]: event.target.files?.[0]?.name || "",
                  })
                }
              />
            </label>
          ))}
        </div>
        <FlowButtons onNext={next} onBack={onBack} />
      </AuthFrame>
    );
  return (
    <AuthFrame
      eyebrow={teacher ? "Review & submit" : "Review & consent"}
      title={title}
      body={
        teacher
          ? "Submitting does not activate a teacher account; the application moves to review and approval."
          : "Review the relationship and required consent before creating the registration."
      }
      step={step}
      labels={labels}
      onBack={onBack}
    >
      <div className="review-cards">
        <div>
          <strong>{teacher ? "Personal details" : "Parent"}</strong>
          <span>Validated profile information</span>
        </div>
        <div>
          <strong>{teacher ? "Qualifications & experience" : "Student"}</strong>
          <span>Linked within the approved school context</span>
        </div>
        <div>
          <strong>{teacher ? "Documents" : "School & grade"}</strong>
          <span>Required fields are ready for submission</span>
        </div>
      </div>
      <label className="check-label consent-label">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />{" "}
        I agree to the required registration consent.
      </label>
      <FlowButtons onNext={next} onBack={onBack} disabled={!consent} finish />
    </AuthFrame>
  );
}
function FlowButtons({
  onNext,
  onBack,
  disabled = false,
  finish = false,
  single = false,
}) {
  return (
    <div className="flow-buttons">
      {!single && (
        <button className="auth-secondary" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </button>
      )}
      <button className="auth-submit" disabled={disabled} onClick={onNext}>
        {finish ? "Submit application" : "Next"} <ArrowRight size={15} />
      </button>
    </div>
  );
}
function ProfileChoice({ setProfile, onBack }) {
  return (
    <AuthFrame
      eyebrow="Google"
      title="Choose a profile"
      body="More than one profile is linked to this authenticated identity."
      step={1}
      labels={["Profile"]}
      onBack={onBack}
    >
      <div className="profile-options">
        {["Parent", "Teacher"].map((value) => (
          <button key={value} onClick={() => setProfile(value)}>
            <b>{value[0]}</b>
            <strong>{value}</strong>
            <span>Taqat School</span>
          </button>
        ))}
      </div>
    </AuthFrame>
  );
}
function TwoFactor({ onVerify, onBack }) {
  const inputs = useRef([]);
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = digit;
    setCode(nextCode);
    if (digit && index < inputs.current.length - 1)
      inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0)
      inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < inputs.current.length - 1)
      inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("");
    const nextCode = ["", "", "", "", "", ""];
    pasted.forEach((digit, index) => {
      nextCode[index] = digit;
    });
    setCode(nextCode);
    inputs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  return (
    <AuthFrame
      eyebrow="2FA"
      title="Two-factor authentication"
      body="Enter the 6-digit verification code. It is valid for 5 minutes and single-use."
      step={1}
      labels={["Verification"]}
      onBack={onBack}
    >
      <div className="otp-inputs">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            value={code[index]}
            maxLength="1"
            inputMode="numeric"
            aria-label={`Verification digit ${index + 1}`}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      <button className="auth-submit" onClick={onVerify}>
        Verify & continue
      </button>
      <p className="auth-hint">
        Resend after 60 seconds • maximum 5 verification attempts
      </p>
    </AuthFrame>
  );
}
function Forgot({ onContinue, onBack }) {
  return (
    <AuthFrame
      eyebrow="Recover access"
      title="Forgot password?"
      body="Enter your email or login. A generic response is shown to protect account privacy."
      step={1}
      labels={["Recovery"]}
      onBack={onBack}
    >
      <div className="auth-form">
        <label>
          Email or login
          <input type="text" />
        </label>
        <button className="auth-submit" onClick={onContinue}>
          Send recovery instructions
        </button>
      </div>
    </AuthFrame>
  );
}
function Reset({ onSave }) {
  return (
    <AuthFrame
      eyebrow="New password"
      title="Reset your password"
      step={1}
      labels={["Reset"]}
      onBack={() => {}}
    >
      <div className="auth-form">
        <label>
          New password
          <input type="password" />
        </label>
        <div className="password-rules">
          ✓ At least 8 characters　 ✓ Upper & lowercase
          <br />✓ Number　　　　 ✓ Special character
        </div>
        <label>
          Confirm password
          <input type="password" />
        </label>
        <button className="auth-submit" onClick={onSave}>
          Save password
        </button>
      </div>
    </AuthFrame>
  );
}
function StatusScreen({
  icon,
  title,
  body,
  action,
  onAction,
  tone = "success",
}) {
  return (
    <div className="status-screen">
      <div className={`status-icon ${tone}`}>{icon}</div>
      <h2>{title}</h2>
      <p>{body}</p>
      <button className="auth-submit" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
