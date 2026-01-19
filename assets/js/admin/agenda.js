let agenda = JSON.parse(localStorage.getItem("agenda")) || [];
const list = document.getElementById("agendaList");

function render() {
  list.innerHTML = "";
  agenda.forEach((a, i) => {
    list.innerHTML += `
      <li>${a.tanggal} - ${a.judul}
      <button onclick="hapus(${i})">x</button></li>`;
  });
}
render();

formAgenda.onsubmit = e => {
  e.preventDefault();
  agenda.push({
    judul: formAgenda.judul.value,
    tanggal: formAgenda.tanggal.value,
    lokasi: formAgenda.lokasi.value
  });
  localStorage.setItem("agenda", JSON.stringify(agenda));
  render();
  formAgenda.reset();
};

function hapus(i) {
  agenda.splice(i, 1);
  localStorage.setItem("agenda", JSON.stringify(agenda));
  render();
}
