const surat = JSON.parse(localStorage.getItem("surat")) || [];
const pengaduan = JSON.parse(localStorage.getItem("pengaduan")) || [];

document.getElementById("totalSurat").innerText = surat.length;
document.getElementById("totalPengaduan").innerText = pengaduan.length;

const tbody = document.getElementById("tableSurat");

surat.forEach((s, i) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${s.nama}</td>
    <td>${s.jenis}</td>
    <td>${s.status}</td>
    <td>
      <button onclick="updateStatus(${i}, 'diproses')">Proses</button>
      <button onclick="updateStatus(${i}, 'selesai')">Selesai</button>
    </td>
  `;
  tbody.appendChild(tr);
});

function updateStatus(index, status) {
  surat[index].status = status;
  localStorage.setItem("surat", JSON.stringify(surat));
  location.reload();
}
