// Utilidad para formatear fechas
const formatDate = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  // Añadir timezone offset para que no reste un día
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date.toLocaleDateString('es-ES', options);
};

// Cargar estado del servidor
async function fetchStatus() {
  const badge = document.getElementById('host-info');
  try {
    const res = await fetch('/api/info');
    const data = await res.json();
    badge.innerHTML = `Host: ${data.hostname}`;
  } catch (error) {
    badge.innerHTML = 'Servidor Desconectado';
    badge.style.borderColor = 'red';
    badge.style.color = 'red';
  }
}

// Cargar y mostrar lista de reservas
async function fetchReservas() {
  const container = document.getElementById('reservasList');
  try {
    const res = await fetch('/api/reservas');
    const reservas = await res.json();
    
    if (reservas.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 40px 0; color: #777;">
          <p>No hay eventos programados.</p>
          <p style="font-size: 0.85rem">Sé el primero en reservar nuestro salón.</p>
        </div>`;
      return;
    }
    
    // Ordenar por fecha más próxima
    reservas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    container.innerHTML = reservas.map(r => `
      <div class="reserva-item">
        <h3>${r.cliente}</h3>
        <div class="reserva-meta">
          <span>${r.tipo}</span>
          <span>👥 ${r.invitados} invitados</span>
        </div>
        <div class="reserva-date">📅 ${formatDate(r.fecha)}</div>
      </div>
    `).join('');
    
  } catch (error) {
    container.innerHTML = '<div class="loading-state" style="color:red;">Error cargando el calendario.</div>';
  }
}

// Manejo del formulario
document.getElementById('reservaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button');
  const originalText = btn.innerText;
  btn.innerText = 'PROCESANDO...';
  btn.disabled = true;

  const payload = {
    cliente: document.getElementById('cliente').value,
    tipo: document.getElementById('tipo').value,
    fecha: document.getElementById('fecha').value,
    invitados: document.getElementById('invitados').value
  };

  try {
    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if(res.ok) {
      e.target.reset();
      // Resetear fecha por defecto a mañana para UX
      const tomo = new Date();
      tomo.setDate(tomo.getDate() + 1);
      document.getElementById('fecha').value = tomo.toISOString().split('T')[0];
      
      await fetchReservas();
    } else {
      alert("Error en el registro. Verifique los datos.");
    }
  } catch (error) {
    alert("No se pudo contactar al servidor.");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
});

// Setup inicial
document.addEventListener('DOMContentLoaded', () => {
  // Configurar fecha mínima a hoy en el input date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fecha').setAttribute('min', today);
  
  // Establecer fecha por defecto (una semana desde hoy)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('fecha').value = nextWeek.toISOString().split('T')[0];

  fetchStatus();
  fetchReservas();
});
