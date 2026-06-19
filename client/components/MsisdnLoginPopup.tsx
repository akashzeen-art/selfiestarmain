import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { DEMO_COUNTRY_CODE, DEMO_MSISDN_LOCAL, toFullMsisdn } from "@shared/demo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

interface MsisdnLoginPopupProps {
  open: boolean;
  onClose?: () => void;
  onLogin: (msisdn: string) => Promise<void>;
  initialNumber?: string;
}

export default function MsisdnLoginPopup({
  open,
  onClose,
  onLogin,
  initialNumber = DEMO_MSISDN_LOCAL,
}: MsisdnLoginPopupProps) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState(initialNumber);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(initialNumber);
      setError("");
    }
  }, [open, initialNumber]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError(t.login.msisdnRequired);
      return;
    }

    const fullMsisdn = toFullMsisdn(phone, DEMO_COUNTRY_CODE);

    try {
      setSubmitting(true);
      await onLogin(fullMsisdn);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.loginFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-neon-purple/30 bg-card/95 backdrop-blur-md p-6 shadow-2xl">
        <div className="text-center mb-5">
          <img src="/image.png" alt="SelfiStar" className="h-12 w-auto mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">{t.login.msisdnTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.login.msisdnDesc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">{t.login.msisdnLabel}</label>
            <div className="flex gap-2">
              <div className="h-10 flex items-center justify-center rounded-md border border-border/40 bg-input px-3 text-sm text-white shrink-0">
                🇮🇳 {DEMO_COUNTRY_CODE}
              </div>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                disabled={submitting}
                className="bg-input border-border/40 focus:border-neon-purple/60 flex-1"
                maxLength={15}
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-white text-black hover:bg-white/90 border border-white/30 py-2 text-base disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t.login.signingIn}
              </>
            ) : (
              t.login.signIn
            )}
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
              className="w-full text-muted-foreground hover:text-white"
            >
              {t.login.cancel}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
