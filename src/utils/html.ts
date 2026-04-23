import { env } from "../config/env";

export const urlRedireccion = `${env.FRONTEND_URL}/login`;

export const htmlExitoVerificacion = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="3;url=${urlRedireccion}">
  <title>Email Verificado — TiendiZi</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Syne', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f7f4ef;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      position: relative;
      overflow: hidden;
    }

    /* Blobs decorativos — igual que el Hero */
    body::before {
      content: '';
      position: fixed;
      top: -80px; right: -80px;
      width: 400px; height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(203,183,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    body::after {
      content: '';
      position: fixed;
      bottom: -60px; left: -60px;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,107,61,0.10) 0%, transparent 70%);
      pointer-events: none;
    }

    .card {
      background: #fff;
      border-radius: 28px;
      padding: 52px 44px 44px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      position: relative;
      box-shadow: 0 4px 40px rgba(21,17,14,0.09), 0 1px 4px rgba(21,17,14,0.06);
      animation: cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(28px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }

    /* ── Logo ── */
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 36px;
      animation: fadeUp 0.5s ease both 0.1s;
    }
    .logo-icon {
      width: 42px; height: 42px;
      background: #15110e;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.04em;
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .logo-text svg.brush {
      position: absolute;
      bottom: -4px; left: -4px;
      width: 108%; height: 140%;
      pointer-events: none;
      z-index: 0;
    }
    .logo-name {
      position: relative;
      z-index: 1;
      color: #7c3aed;
    }

    /* ── Confetti decorativo ── */
    .confetti-row {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 20px;
      animation: fadeUp 0.4s ease both 0.3s;
    }
    .conf {
      width: 8px; height: 8px;
      border-radius: 2px;
      animation: wiggle 1.8s ease-in-out infinite;
    }
    @keyframes wiggle {
      0%,100% { transform: rotate(0deg) translateY(0); }
      25%      { transform: rotate(15deg) translateY(-3px); }
      75%      { transform: rotate(-15deg) translateY(-2px); }
    }

    /* ── Check ring ── */
    .check-ring {
      width: 88px; height: 88px;
      border-radius: 50%;
      background: #fff8f5;
      border: 2.5px solid #ff6b3d;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px;
      animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both 0.25s;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.4) rotate(-20deg); }
      to   { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    .check-inner {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: #ff6b3d;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Badge ── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 100px;
      margin-bottom: 18px;
      animation: fadeUp 0.4s ease both 0.35s;
    }
    .badge-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(0.7); }
    }

    h1 {
      font-size: 30px;
      font-weight: 800;
      color: #15110e;
      letter-spacing: -0.04em;
      line-height: 1.1;
      margin: 0 0 12px;
      animation: fadeUp 0.45s ease both 0.4s;
    }

    .subtitle {
      font-size: 15px;
      color: #64584f;
      line-height: 1.6;
      margin: 0 0 32px;
      animation: fadeUp 0.45s ease both 0.48s;
    }
    .subtitle strong {
      color: #15110e;
      font-weight: 700;
    }

    .divider {
      height: 1px;
      background: #ece8e2;
      margin: 0 0 24px;
      animation: fadeUp 0.4s ease both 0.52s;
    }

    .countdown {
      font-size: 13px;
      color: #a0978f;
      margin-bottom: 20px;
      animation: fadeUp 0.4s ease both 0.56s;
      min-height: 20px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #15110e;
      color: #fff;
      font-family: 'Syne', sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0 32px;
      height: 52px;
      border-radius: 100px;
      border: none;
      cursor: pointer;
      width: 100%;
      text-decoration: none;
      transition: background 0.18s, transform 0.15s;
      animation: fadeUp 0.45s ease both 0.62s;
    }
    .btn:hover { background: #2c241f; transform: translateY(-2px); }
    .btn:active { transform: scale(0.98); }

    .footer-note {
      margin-top: 24px;
      font-size: 12px;
      color: #b0a49c;
      animation: fadeUp 0.4s ease both 0.68s;
    }
    .footer-note a {
      color: #7c3aed;
      text-decoration: none;
      font-weight: 700;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 480px) {
      .card { padding: 36px 24px 32px; }
      h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="card">

    <!-- Logo TiendiZi -->
    <div class="logo">
      <div class="logo-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 18L12 6L18 18" stroke="#ff6b3d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8.5 13.5H15.5" stroke="#ff6b3d" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="logo-text">
        <!-- Brush strokes naranjas detrás del nombre -->
        <svg class="brush" viewBox="0 0 100 48" fill="none" stroke="#fca326" stroke-width="14" stroke-linecap="round">
          <path d="M92,24 L10,24" style="opacity:0.9"/>
          <path d="M8,38 L95,34" style="opacity:0.8"/>
        </svg>
        <span class="logo-name">TiendiZi</span>
      </div>
    </div>

    <!-- Confetti decorativo -->
    <div class="confetti-row">
      <div class="conf" style="background:#ff6b3d; animation-delay:0s"></div>
      <div class="conf" style="background:#7c3aed; border-radius:50%; animation-delay:0.15s"></div>
      <div class="conf" style="background:#fca326; animation-delay:0.3s"></div>
      <div class="conf" style="background:#ff6b3d; border-radius:50%; animation-delay:0.45s"></div>
      <div class="conf" style="background:#7c3aed; animation-delay:0.6s"></div>
    </div>

    <!-- Ícono de check -->
    <div class="check-ring">
      <div class="check-inner">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M7 16.5L13 22.5L25 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <!-- Badge de estado -->
    <div class="badge">
      <div class="badge-dot"></div>
      Email verificado
    </div>

    <h1>¡Tu tienda está<br>lista para volar!</h1>

    <p class="subtitle">
      Verificaste tu email con éxito. Ya podés ingresar
      a tu cuenta y empezar a vender
      <strong>sin pagar comisiones</strong>.
    </p>

    <div class="divider"></div>

    <p class="countdown" id="countdown">Redirigiendo en 3 segundos...</p>

    <a href="${urlRedireccion}" class="btn">
      Ir a mi tienda
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>

    <p class="footer-note">
      ¿Problemas para ingresar?
      <a href="${env.FRONTEND_URL}/soporte">Contactá soporte</a>
    </p>

  </div>

  <script>
    let seconds = 3;
    const el = document.getElementById('countdown');
    const t = setInterval(() => {
      seconds--;
      if (seconds > 0) {
        el.textContent = 'Redirigiendo en ' + seconds + ' segundo' + (seconds > 1 ? 's' : '') + '...';
      } else {
        el.textContent = 'Redirigiendo...';
        clearInterval(t);
      }
    }, 1000);
  </script>
</body>
</html>`;