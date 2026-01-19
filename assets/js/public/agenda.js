const agendaData = [
  {
    id: 1,
    tanggal: "15 Desember 2024",
    judul: "Rapat Koordinasi RT/RW",
    lokasi: "Kantor Kelurahan",
    kategori: "Rapat"
  },
  {
    id: 2,
    tanggal: "18 Desember 2024",
    judul: "Vaksinasi Lansia",
    lokasi: "Puskesmas",
    kategori: "Kesehatan"
  }
];

function renderAgendaPublic() {
  const container = document.getElementById("agendaList");
  container.innerHTML = "";

  agendaData.forEach(item => {
    container.innerHTML += `
      <div class="agenda-card">
        <div class="agenda-date">${item.tanggal}</div>
        <h3>${item.judul}</h3>
        <p>${item.lokasi}</p>
        <span class="badge">${item.kategori}</span>
      </div>
    `;
  });
}

renderAgendaPublic();
