import { env } from "../config/env";

export const urlRedirecccion = `${env.FRONTEND_URL}/login`;

export const htmlExitoVerificacion = ` <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="3;url=${urlRedirecccion}">
      <title>Email Verificado</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 60px 40px;
          text-align: center;
          max-width: 500px;
          animation: slideIn 0.6s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px;
          animation: checkmarkAnimation 0.8s ease-out 0.3s both;
        }
        @keyframes checkmarkAnimation {
          from {
            transform: scale(0) rotateZ(-45deg);
          }
          to {
            transform: scale(1) rotateZ(0);
          }
        }
        .checkmark {
          color: white;
          font-size: 45px;
          font-weight: bold;
          line-height: 1;
        }
        h1 {
          color: #333;
          font-size: 32px;
          margin-bottom: 15px;
        }
        .message {
          color: #666;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .timer {
          color: #667eea;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">
          <span class="checkmark">✓</span>
        </div>
        <h1>¡Email Verificado!</h1>
        <p class="message">Tu email ha sido verificado exitosamente. Tu cuenta está lista para usar.</p>
        <div class="timer">
          <span id="countdown">Redirigiendo en 3 segundos...</span>
        </div>
        <a href="${urlRedirecccion}" class="button">Ir a iniciar sesión</a>
      </div>

      <script>
        let seconds = 3;
        setInterval(() => {
          seconds--;
          if (seconds > 0) {
            document.getElementById('countdown').textContent = \`Redirigiendo en \${seconds} segundo\${seconds > 1 ? 's' : ''}...\`;
          }
        }, 1000);
      </script>
    </body>
    </html>
  `;
