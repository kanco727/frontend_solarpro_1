import React, { useState, useEffect } from "react";
import { Sun, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// 🖼️ Tes images de fond
import bg1 from "../../assets/bg-dashboard.jpg";
import bg2 from "../../assets/bg-solar2.jpg";
import bg3 from "../../assets/bg-solar3.jpg";

// 🧠 Messages à afficher
const messages = [
  {
    title: "SolarPro Monitoring",
    text: "La plateforme intelligente pour la gestion et le suivi en temps réel des mini-grids solaires au Burkina Faso.",
  },
  {
    title: "Suivi Intelligent",
    text: "⚡ Production, 🔋 Batteries, 🌍 Sites — tout en un seul tableau de bord connecté.",
  },
  {
    title: "Innovation Solaire",
    text: "“Connecter l’énergie solaire à l’avenir durable.”",
  },
];

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading, message } = useAuth();
  const navigate = useNavigate();

  const [currentImage, setCurrentImage] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  // 🎞️ Change image + texte toutes les 8s avec fondu lent
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % 3);
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(email, password);
    if (success) navigate("/");
    else setError("Email ou mot de passe incorrect");
  };

  const bgImages = [bg1, bg2, bg3];

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* ---------- Images de fond ---------- */}
      {bgImages.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[4000ms] ease-in-out ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${img})` }}
        ></div>
      ))}

      {/* ---------- Dégradé sombre ---------- */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* ---------- Texte dynamique (au-dessus du formulaire) ---------- */}
      <div className="absolute top-[6%] md:top-[8%] left-1/2 transform -translate-x-1/2 text-center text-white px-6 md:px-20 z-30 max-w-2xl">
        <h1
          key={messages[currentMessage].title}
          className="text-4xl md:text-5xl font-bold mb-3 text-yellow-400 drop-shadow-lg animate-fadeIn"
        >
          {messages[currentMessage].title}
        </h1>
        <p
          key={messages[currentMessage].text}
          className="text-base md:text-lg text-gray-200 leading-relaxed animate-fadeIn"
        >
          {messages[currentMessage].text}
        </p>
      </div>

      {/* ---------- Formulaire centré mais descendu ---------- */}
     <div className="relative z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-[90%] max-w-sm border border-white/30 animate-slideUp mt-[240px] md:mt-[300px] lg:mt-[340px]">

        <div className="text-center mb-6">
          <div className="bg-green-500 w-14 h-14 mx-auto rounded-full flex items-center justify-center shadow-lg">
            <Sun className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mt-3 text-gray-900">SolarPro</h2>
          <p className="text-sm text-gray-500">
            Plateforme de Gestion des Mini-Grids
          </p>
          <p className="text-xs text-green-600 font-medium">Burkina Faso</p>
        </div>

        {/* 🔔 Messages et erreurs */}
        {message && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg text-sm text-center mb-3">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center mb-3">
            {error}
          </div>
        )}

        {/* 🧾 Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="votre.email@exemple.bf"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          © {new Date().getFullYear()} SolarPro — by NaanaTechnologie
        </div>
      </div>
    </div>
  );
}
