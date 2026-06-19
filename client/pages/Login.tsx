import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import VideoBackground from "@/components/VideoBackground";
import Footer from "@/components/Footer";
import MsisdnLoginPopup from "@/components/MsisdnLoginPopup";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!isLoading) {
      setShowPopup(true);
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const handleMsisdnLogin = async (msisdn: string) => {
    await login(msisdn, "", true);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <VideoBackground />

      <MsisdnLoginPopup
        open={showPopup && !isAuthenticated}
        onClose={() => setShowPopup(false)}
        onLogin={handleMsisdnLogin}
      />

      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center">
          <img src="/image.png" alt="SelfiStar" className="h-16 w-auto mx-auto mb-4" />
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
